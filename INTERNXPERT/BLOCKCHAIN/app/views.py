from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from django.http.response import *
from .models import *
from .logic import *
import requests
# Create your views here.

@api_view(['POST'])
def profile_store(request):
    name = request.data.get('name')
    email = request.data.get('email')
    number = request.data.get('number')
    
    resume = request.FILES.get('resume')
    if not resume:
        return Response({"error": "File is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    if not name or not email:
        return Response({"error": "Name, email, and ID are required"}, status=status.HTTP_400_BAD_REQUEST)
    
    url = "http://127.0.0.1:5000/upload/"
    payload = {}
    files = [('file', resume)]
    headers = {}
    
    response = requests.post(url, headers=headers, data=payload, files=files)
    gg = response.json()
    print("IPFS Response:", gg)
    
    if "Success" in gg:
        blockchain = addNewData({
            "Type": "resume",
            "name": name,
            "email": email,
            'file': gg['Success'],
            'fileType': resume.name.split('.')[1]
        })
        print("File Upload to Blockchain status:", blockchain)
        print('data :',retrieveData())
        return Response(
            {"message": "File uploaded successfully", "name": name, "email": email, "file_path": gg['Success']},
            status=status.HTTP_200_OK
        )
    else:
        return Response({"error": "Failed to upload file to IPFS"}, status=status.HTTP_400_BAD_REQUEST)
    
    
from django.http import HttpResponse
import requests
@api_view(['GET'])
def download_resume(request, file_id: int):
    try:
        file_data = retrieveData()
        print("file_data", file_data)
        print("length of records in blockchain:", len(file_data))

        file_info = None
        for record in file_data:
            if record.get('sumID') == file_id:
                file_info = record
                break

        if not file_info:
            return Response(
                {"error": f"File with sumID {file_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        file_cid = file_info['file']
        file_type = file_info['fileType']
        user_name = file_info.get('name', 'User').replace(" ", "_")
        
        ipfs_url = f"http://127.0.0.1:5000/download/{file_cid}/{file_type}"
        ipfs_response = requests.get(ipfs_url, stream=True)

        if ipfs_response.status_code != 200:
            return Response({"error": "Failed to fetch file from IPFS"}, status=400)
        
        response = HttpResponse(
            ipfs_response.content,
            content_type='application/pdf'  # Important!
        )
        response['Content-Disposition'] = f'attachment; filename="{user_name}_Resume.pdf"'

        return response

    except Exception as e:
        print(f"Error: {str(e)}")
        return Response({"error": str(e)}, status=500)
    


@api_view(['POST'])
def interview_store(request):
    try:
        print('api calling ./.....')
        _id = request.data.get('_id')
        company = request.data.get('company')
        student = request.data.get('student')
        position = request.data.get('position')
        scheduledDate = request.data.get('scheduledDate')
        scheduledTime = request.data.get('scheduledTime')
        duration = request.data.get('duration')
        interviewType = request.data.get('interviewType')
        status_ = request.data.get('status_')
        createdAt = request.data.get('createdAt')
        updatedAt = request.data.get('updatedAt')
        
        if status_ == 'Scheduled':
            data = addNewData(
                {
                    'Type' : 'Interview',
                    '_id ': _id,
                    'company ': company,
                    'student ': student,
                    'position ': position,
                    'scheduledDate ': scheduledDate,
                    'scheduledTime ': scheduledTime,
                    'duration ': duration,
                    'interviewType ': interviewType,
                    'status_ ': status_,
                    'createdAt ': createdAt,
                    'updatedAt ': updatedAt,
                }
            )
            
            print('blockchain store :', data)
            print('Exsting data :', retrieveData())
            return Response(
            {"message": "Interview Schduled successfully", 
                    '_id ': _id,
                    'company ': company,
                    'student ': student,
                    'position ': position,
                    'scheduledDate ': scheduledDate,
                    'scheduledTime ': scheduledTime,
                    'duration ': duration,
                    'interviewType ': interviewType,
                    'status_ ': status_,
                    'createdAt ': createdAt,
                    'updatedAt ': updatedAt,},
            status=status.HTTP_200_OK
        )
        else:
            return Response({"error": "Status is required must be Scheduled "}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Error: {str(e)}")
        return Response({"error": str(e)}, status=500)
    
    