from rest_framework.permissions import IsAuthenticated
from rest_framework import permissions
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import PermissionDenied
from .models import *
from .serializers import *
from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken, APIView
from .permissions import *
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework import status
from django.contrib.auth import logout
from .models import ChatMessage
from django.db.models import Q
from django.db.models import Prefetch
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from .models import ChatMessage
from .serializers import ChatMessageSerializer
import logging


class DoctorViewSet(ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    @action(detail=False, methods=['get', 'put'])
    def me(self, request):
        try:
            doctor = request.user.doctor
            if request.method == 'PUT':
                serializer = DoctorSerializer(doctor, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data)
            serializer = DoctorSerializer(doctor)
            return Response(serializer.data)
        except Doctor.DoesNotExist:
            return Response(
                {"detail": "Doctor profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

class PatientViewSet(ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    @action(detail=False, methods=['get', 'put'])
    def me(self, request):
        try:
            patient = request.user.patient
            if request.method == 'PUT':
                serializer = PatientSerializer(patient, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data)
            serializer = PatientSerializer(patient)
            return Response(serializer.data)
        except Patient.DoesNotExist:
            return Response(
                {"detail": "Patient profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

class StatusViewSet(viewsets.ModelViewSet):
    serializer_class = StatusSerializer
    authentication_classes = [TokenAuthentication]
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsDoctor()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return Status.objects.filter(
            status_expires_at__gt=timezone.now()
        ).order_by('-status_posted_at')

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'doctor'):
            raise PermissionDenied("Only doctors can create statuses")
        serializer.save(doctor=self.request.user.doctor)

class DoctorSignUpView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = DoctorSignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_doctor": user.is_doctor
            },
            "doctor": DoctorSerializer(user.doctor).data,
            "token": token.key,
            "message": "Account created successfully"
        }, status=status.HTTP_201_CREATED)

class PatientSignUpView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = PatientSignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_patient": user.is_patient
            },
            "patient": PatientSerializer(user.patient).data,
            "token": token.key,
            "message": "Account created successfully"
        }, status=status.HTTP_201_CREATED)

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)

        patient_data = {}
        if user.is_patient:
            try:
                patient = Patient.objects.get(user=user)
                patient_data = PatientSerializer(patient).data
            except Patient.DoesNotExist:
                pass

        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'is_doctor': user.is_doctor,
                'is_patient': user.is_patient,
            },
            'patient': patient_data
        })
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    request.user.auth_token.delete()
    return Response({"detail": "Successfully logged out."})
    
class DoctorsOnlyView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated&DoctorPermissions]
    serializer_class = UserSerializer
    
    authentication_classes = (TokenAuthentication,)

    def get_object(self):
        return self.request.user
    
class PatientsOnlyView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated&PatientPermissions]
    serializer_class = UserSerializer
    
    authentication_classes = (TokenAuthentication,)

    def get_object(self):
        return self.request.user

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'is_doctor': user.is_doctor,
            'is_patient': user.is_patient
        })

class ConsultationViewSet(viewsets.ModelViewSet): 
    serializer_class = ConsultationSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        user = self.request.user
        return Consultation.objects.filter(
            Q(doctor__user=user) | Q(patient__user=user)
        ).select_related(
            'doctor', 'doctor__user',
            'patient', 'patient__user'
        ).prefetch_related(
            Prefetch('messages', queryset=ChatMessage.objects.order_by('-timestamp'))
        ).distinct().order_by('-created_at') 

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        # Set doctor and patient based on request data
        doctor_id = self.request.data.get('doctor_id')
        patient_id = self.request.data.get('patient_id')
        try:
            doctor = Doctor.objects.get(user_id=doctor_id)
            patient = Patient.objects.get(user_id=patient_id)
        except (Doctor.DoesNotExist, Patient.DoesNotExist):
            return Response(
                {"detail": "Invalid doctor or patient ID"},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer.save(
            doctor=doctor,
            patient=patient,
            consultation_type='chat', 
            status='pending'
        )

logger = logging.getLogger(__name__)

class ChatMessageList(ListAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    pagination_class = None 

    def get_queryset(self):
        consultation_id = self.kwargs['consultation_id']
        logger.info(f"Fetching messages for consultation_id: {consultation_id}")
        queryset = ChatMessage.objects.filter(
            consultation_id=consultation_id
        ).select_related('sender').order_by('timestamp')
        logger.info(f"Found {queryset.count()} messages for consultation_id: {consultation_id}")
        return queryset

    def get_serializer_context(self):
        return {'request': self.request}
    
class MarkMessagesAsReadView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, consultation_id):
        try:
            consultation = Consultation.objects.get(id=consultation_id)
            if request.user != consultation.doctor.user and request.user != consultation.patient.user:
                return Response(
                    {"detail": "You do not have permission to mark messages in this consultation."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            ChatMessage.objects.filter(
                consultation_id=consultation_id,
                is_read=False
            ).exclude(
                sender=request.user
            ).update(is_read=True)

            return Response({"status": "success"}, status=status.HTTP_200_OK)
        except Consultation.DoesNotExist:
            return Response(
                {"detail": "Consultation not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class NoteListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            if not hasattr(request.user, 'doctor'):
                return Response({"detail": "User is not a doctor"}, status=status.HTTP_403_FORBIDDEN)
            notes = Note.objects.filter(doctor=request.user.doctor)
            serializer = NoteSerializer(notes, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response({"detail": f"Error fetching notes: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            if not hasattr(request.user, 'doctor'):
                return Response({"detail": "User is not a doctor"}, status=status.HTTP_403_FORBIDDEN)
            serializer = NoteSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": f"Error creating note: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)