const API_URL = "http://127.0.0.1:8000";

const logic = {
    obtenerReportes: async function() {
        const res = await fetch(`${API_URL}/reportes`);
        return await res.json();
    },
    agregarReporte: async function(datos) {
        await fetch(`${API_URL}/reportes`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(datos)
        });
    },
    cambiarEstado: async function(id, n) {
        await fetch(`${API_URL}/reportes/${id}?nuevo_estado=${n}`, { method: 'PATCH' });
    },
    eliminarReporte: async function(id) {
        await fetch(`${API_URL}/reportes/${id}`, { method: 'DELETE' });
    }
};