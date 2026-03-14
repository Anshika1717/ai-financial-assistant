import io
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from app.services.analyzer import analyze_transactions

router = APIRouter()

@router.get("/sample")
def analyze_sample():
    try:
        df = pd.read_csv("data/sample_transactions.csv")
        return JSONResponse(content=analyze_transactions(df, "sample_transactions.csv"))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@router.post("/analyze")
async def analyze_uploaded_file(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded CSV is empty")
        df = pd.read_csv(io.BytesIO(content))
        return JSONResponse(content=analyze_transactions(df, file.filename))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
