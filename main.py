from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import List, Optional
import uuid

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

# Dependencia para la sesión de DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ENDPOINTS ---

@app.get("/reportes", response_model=List[ReporteSchema])
def obtener_reportes(db: Session = Depends(get_db)):
    return db.query(ReporteDB).all()

@app.post("/reportes", response_model=ReporteSchema)
def crear_reporte(reporte: ReporteSchema, db: Session = Depends(get_db)):
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