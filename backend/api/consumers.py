# api/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework.authtoken.models import Token
from .models import Consultation, ChatMessage
from channels.db import database_sync_to_async
import logging
import sqlite3
import asyncio

logger = logging.getLogger(__name__)

class ConsultationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.consultation_id = self.scope['url_route']['kwargs']['consultation_id']
        self.room_group_name = f'consultation_{self.consultation_id}'
        token = self.scope['query_string'].decode().split('token=')[-1] if 'token=' in self.scope['query_string'].decode() else None

        if not token:
            logger.error(f"No token provided for consultation {self.consultation_id}")
            await self.close(code=4001)
            return

        user = await self.get_user_from_token(token)
        if not user:
            logger.error(f"Invalid token for consultation {self.consultation_id}: {token}")
            await self.close(code=4001)
            return

        try:
            consultation = await self.validate_consultation(self.consultation_id)
            # Check if user is authorized for the consultation
            is_authorized = await self.check_user_authorization(consultation, user)
            if not is_authorized:
                logger.error(f"User {user.username} not authorized for consultation {self.consultation_id}")
                await self.close(code=4003)
                return
        except Consultation.DoesNotExist:
            logger.error(f"Consultation {self.consultation_id} does not exist")
            await self.close(code=4002)
            return

        self.user = user
        try:
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()
            logger.info(f"WebSocket connected: user={user.username}, consultation={self.consultation_id}")
            # Start keep-alive
            self.keep_alive_task = asyncio.create_task(self.send_keep_alive())
        except Exception as e:
            logger.error(f"Failed to join group for consultation {self.consultation_id}: {str(e)}")
            await self.close(code=1011)

    async def disconnect(self, close_code):
        try:
            if hasattr(self, 'keep_alive_task'):
                self.keep_alive_task.cancel()
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            logger.info(f"WebSocket disconnected: consultation={self.consultation_id}, code={close_code}, reason={self.scope.get('close_reason', 'unknown')}")
        except Exception as e:
            logger.error(f"Error during disconnect for consultation {self.consultation_id}: {str(e)}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            logger.debug(f"Received message for consultation {self.consultation_id}: {data}")

            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
                return

            if data.get('type') == 'mark_read':
                await self.handle_mark_read()
                return

            if data.get('type') != 'message':
                logger.warning(f"Unknown message type for consultation {self.consultation_id}: {data.get('type')}")
                await self.send(text_data=json.dumps({'error': 'Unknown message type'}))
                return

            content = data.get('content')
            consultation_id = data.get('consultation_id')

            if not content or not consultation_id:
                logger.warning(f"Missing content or consultation_id: {data}")
                await self.send(text_data=json.dumps({'error': 'Missing content or consultation_id'}))
                return

            if str(consultation_id) != self.consultation_id:
                logger.warning(f"Invalid consultation_id: received {consultation_id}, expected {self.consultation_id}")
                await self.send(text_data=json.dumps({'error': 'Invalid consultation_id'}))
                return

            message = await self.save_message(consultation_id, content)
            unread_count = await self.get_unread_count(consultation_id)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'new_message',
                    'message': {
                        'id': message.id,
                        'content': message.content,
                        'timestamp': message.timestamp.isoformat(),
                        'sender': {
                            'id': message.sender.id,
                            'name': message.sender.username,
                        },
                        'sender_type': message.sender_type,
                        'is_read': message.is_read,
                    },
                    'unread_count': unread_count,
                }
            )
            logger.info(f"Broadcasted message {message.id} with unread_count {unread_count} for consultation {consultation_id}")

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON for consultation {self.consultation_id}: {str(e)}")
            await self.send(text_data=json.dumps({'error': 'Invalid JSON'}))
        except sqlite3.OperationalError as e:
            logger.error(f"SQLite error for consultation {self.consultation_id}: {str(e)}")
            await self.send(text_data=json.dumps({'error': 'Database error, please try again'}))
        except Exception as e:
            logger.error(f"Error processing message for consultation {self.consultation_id}: {str(e)}")
            await self.send(text_data=json.dumps({'error': f'Server error: {str(e)}'}))

    async def new_message(self, event):
        try:
            logger.debug(f"Sending new_message for consultation {self.consultation_id}: {event['message']}")
            await self.send(text_data=json.dumps({
                'type': 'new_message',
                'message': event['message'],
                'unread_count': event['unread_count'],
            }))
        except Exception as e:
            logger.error(f"Error sending new_message for consultation {self.consultation_id}: {str(e)}")

    async def unread_count_update(self, event):
        try:
            logger.debug(f"Sending unread_count_update for consultation {self.consultation_id}: {event['unread_count']}")
            await self.send(text_data=json.dumps({
                'type': 'unread_count_update',
                'consultation_id': event['consultation_id'],
                'unread_count': event['unread_count'],
            }))
        except Exception as e:
            logger.error(f"Error sending unread_count_update for consultation {self.consultation_id}: {str(e)}")

    async def handle_mark_read(self):
        try:
            unread_count = await self.mark_messages_as_read(self.consultation_id)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'unread_count_update',
                    'consultation_id': self.consultation_id,
                    'unread_count': unread_count,
                }
            )
            logger.info(f"Broadcasted unread_count_update for consultation {self.consultation_id}: {unread_count}")
        except Exception as e:
            logger.error(f"Error handling mark_read for consultation {self.consultation_id}: {str(e)}")
            await self.send(text_data=json.dumps({'error': f'Server error: {str(e)}'}))

    async def send_keep_alive(self):
        while True:
            try:
                await asyncio.sleep(30)
                await self.send(text_data=json.dumps({'type': 'ping'}))
                logger.debug(f"Sent keep-alive ping for consultation {self.consultation_id}")
            except Exception as e:
                logger.error(f"Keep-alive error for consultation {self.consultation_id}: {str(e)}")
                break

    @database_sync_to_async
    def save_message(self, consultation_id, content):
        try:
            consultation = Consultation.objects.get(id=consultation_id)
            sender_type = 'doctor' if hasattr(self.user, 'is_doctor') and self.user.is_doctor else 'patient'
            logger.debug(f"Saving message for user {self.user.username}, sender_type: {sender_type}, consultation: {consultation_id}")
            message = ChatMessage.objects.create(
                consultation=consultation,
                sender=self.user,
                sender_type=sender_type,
                content=content,
                is_read=False,
            )
            logger.info(f"Saved message {message.id} for consultation {consultation_id}")
            return message
        except Consultation.DoesNotExist:
            logger.error(f"Consultation {consultation_id} does not exist")
            raise
        except sqlite3.OperationalError as e:
            logger.error(f"SQLite error saving message for consultation {consultation_id}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Failed to save message for consultation {consultation_id}: {str(e)}")
            raise

    @database_sync_to_async
    def get_unread_count(self, consultation_id):
        try:
            return ChatMessage.objects.filter(
                consultation_id=consultation_id,
                is_read=False
            ).exclude(
                sender=self.user
            ).count()
        except Exception as e:
            logger.error(f"Failed to get unread_count for consultation {consultation_id}: {str(e)}")
            raise

    @database_sync_to_async
    def mark_messages_as_read(self, consultation_id):
        try:
            ChatMessage.objects.filter(
                consultation_id=consultation_id,
                is_read=False
            ).exclude(
                sender=self.user
            ).update(is_read=True)
            unread_count = ChatMessage.objects.filter(
                consultation_id=consultation_id,
                is_read=False
            ).exclude(
                sender=self.user
            ).count()
            logger.info(f"Marked messages as read for consultation {consultation_id}, new unread_count: {unread_count}")
            return unread_count
        except Exception as e:
            logger.error(f"Failed to mark messages as read for consultation {consultation_id}: {str(e)}")
            raise

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            user = Token.objects.get(key=token).user
            logger.info(f"Authenticated user: {user.username}")
            return user
        except Token.DoesNotExist:
            logger.error(f"Token not found: {token}")
            return None

    @database_sync_to_async
    def validate_consultation(self, consultation_id):
        return Consultation.objects.get(id=consultation_id)

    @database_sync_to_async
    def check_user_authorization(self, consultation, user):
        try:
            return user == consultation.doctor.user or user == consultation.patient.user
        except Exception as e:
            logger.error(f"Error checking authorization for user {user.username} in consultation {consultation.id}: {str(e)}")
            return False