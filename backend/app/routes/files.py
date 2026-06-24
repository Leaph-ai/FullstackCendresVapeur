from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import shutil
from pathlib import Path

router = APIRouter()

UPLOAD_DIRECTORY = "uploads"
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "webp"}

@router.post("/upload", tags=["files"])
async def upload_file(file: UploadFile = File(...)):
    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File extension not allowed")

    upload_dir = Path(UPLOAD_DIRECTORY)
    upload_dir.mkdir(exist_ok=True)
    
    file_path = upload_dir / file.filename
    
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return JSONResponse(content={"filename": file.filename, "content_type": file.content_type})
