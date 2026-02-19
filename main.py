from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import List, Optional
import uuid
from google.cloud import language_v1
import os

# Configuración de la Base de Datos SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./reportes.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Definición del modelo para la Base de Datos
class ReporteDB(Base):
    __tablename__ = "reportes"
    id = Column(String, primary_key=True, index=True)
    problema = Column(String)
    ubicacion = Column(String)
    desc = Column(String)
    prioridad = Column(String)
    estado = Column(String, default="pendiente")

# Crear las tablas
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Esquema para Pydantic (lo que recibe y envía la API)
class ReporteSchema(BaseModel):
    id: Optional[str] = None
    problema: str
    ubicacion: str
    desc: str
    prioridad: str
    estado: str = "pendiente"

    class Config:
        from_attributes = True

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

API_KEY = "AIzaSyA51lrrs2q2P82qsl4OQF7PZztqVia9e3g"

def moderar_contenido(texto: str):
    # Creamos el cliente de la API
    client = language_v1.LanguageServiceClient(client_options={"api_key": API_KEY})
    
    document = language_v1.Document(
        content=texto, 
        type_=language_v1.Document.Type.PLAIN_TEXT,
    )

    response = client.moderate_text(document=document)
    
    for category in response.moderation_categories:
        if category.name in ["Toxic", "Insult", "Profanity"] and category.confidence > 0.7:
            return True 
            
    return False


# --- ENDPOINTS ---

@app.get("/reportes", response_model=List[ReporteSchema])
def obtener_reportes(db: Session = Depends(get_db)):
    return db.query(ReporteDB).all()

@app.post("/reportes", response_model=ReporteSchema)
def crear_reporte(reporte: ReporteSchema, db: Session = Depends(get_db)):
    if moderar_contenido(reporte.desc):
        raise HTTPException(
            status_code=400, 
            detail="El reporte contiene lenguaje inapropiado y no puede ser enviado."
        )

    db_reporte = ReporteDB(
        id=str(uuid.uuid4())[:8],
        problema=reporte.problema,
        ubicacion=reporte.ubicacion,
        desc=reporte.desc,
        prioridad=reporte.prioridad,
        estado="pendiente"
    )
    db.add(db_reporte)
    db.commit()
    db.refresh(db_reporte)
    return db_reporte

@app.patch("/reportes/{reporte_id}")
def actualizar_estado(reporte_id: str, nuevo_estado: str, db: Session = Depends(get_db)):
    db_reporte = db.query(ReporteDB).filter(ReporteDB.id == reporte_id).first()
    if not db_reporte:
        raise HTTPException(status_code=404, detail="No encontrado")
    db_reporte.estado = nuevo_estado
    db.commit()
    return db_reporte

@app.delete("/reportes/{reporte_id}")
def eliminar_reporte(reporte_id: str, db: Session = Depends(get_db)):
    db_reporte = db.query(ReporteDB).filter(ReporteDB.id == reporte_id).first()
    if not db_reporte:
        raise HTTPException(status_code=404, detail="No encontrado")
    db.delete(db_reporte)
    db.commit()
    return {"message": "Eliminado"}