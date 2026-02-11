const ui = {
    reportesLocales: [],

    showSection: function(id) {
        document.querySelectorAll('main > div').forEach(div => div.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
    },

    abrirDashboard: async function() {
        this.showSection('view-dashboard');
        this.reportesLocales = await logic.obtenerReportes();
        this.renderizarTablaPublica(this.reportesLocales);
        this.actualizarStats(this.reportesLocales);
    },

    abrirPanel: async function() {
        this.showSection('view-panel');
        this.reportesLocales = await logic.obtenerReportes();
        this.renderizarTablaGestion(this.reportesLocales);
    },

    filtrarReportes: function(tipo) {
        const idInput = tipo === 'dash' ? 'busqueda-dash' : 'busqueda-panel';
        const idBtn = tipo === 'dash' ? 'clear-dash' : 'clear-panel';
        const input = document.getElementById(idInput);
        const btnClear = document.getElementById(idBtn);

        const termino = input.value.toLowerCase();

        if (termino.length > 0) {
            btnClear.classList.remove('hidden');
        } else {
            btnClear.classList.add('hidden');
        }

        const filtrados = this.reportesLocales.filter(r => 
            r.problema.toLowerCase().includes(termino) || 
            r.ubicacion.toLowerCase().includes(termino) || 
            r.id.toLowerCase().includes(termino)
        );

        tipo === 'dash' ? this.renderizarTablaPublica(filtrados) : this.renderizarTablaGestion(filtrados);
    },

    limpiarBusqueda: function(tipo) {
        const idInput = tipo === 'dash' ? 'busqueda-dash' : 'busqueda-panel';
        const input = document.getElementById(idInput);
        
        input.value = ''; // Vaciar el campo
        this.filtrarReportes(tipo); // Re-ejecutar el filtro para mostrar todo
        input.focus(); // Devolver el foco al input
    },

    renderizarTablaPublica: function(lista) {
        const body = document.getElementById('tabla-dashboard');
        body.innerHTML = lista.map(i => `<tr class="row-${i.estado}"><td>${i.id}</td><td>${i.problema}</td><td>${i.ubicacion}</td><td>${i.desc}</td></tr>`).join('');
    },

    renderizarTablaGestion: function(lista) {
        const body = document.getElementById('tabla-gestion');
        body.innerHTML = lista.map(i => {
            const btn = i.estado === 'resuelto' ? `<button onclick="ui.accionEliminar('${i.id}')" style="background:red;color:white">BORRAR</button>` : `<button onclick="ui.accionAvanzar('${i.id}','${i.estado}')">AVANZAR</button>`;
            return `<tr class="row-${i.estado}"><td>${i.id}</td><td>${i.problema}</td><td>${i.ubicacion}</td><td>${i.estado}</td><td>${btn}</td></tr>`;
        }).join('');
    },

    actualizarStats: function(lista) {
        const s = { pendiente: 0, proceso: 0, resuelto: 0 };
        lista.forEach(i => s[i.estado]++);
        document.getElementById('d-pend').innerText = s.pendiente;
        document.getElementById('d-proc').innerText = s.proceso;
        document.getElementById('d-res').innerText = s.resuelto;

        const total = lista.length;
        const porcentaje = total > 0 ? Math.round((s.resuelto / total) * 100) : 0;

        const barFill = document.getElementById('progress-fill');
        const barText = document.getElementById('progress-percent');

        barFill.style.width = `${porcentaje}%`;
        barText.innerText = `${porcentaje}%`;
    },

    validarLogin: function() { if(document.getElementById('pass').value === "admin123") this.abrirPanel(); else alert("Error"); },
    accionAvanzar: async function(id, est) { await logic.cambiarEstado(id, est === 'pendiente' ? 'proceso' : 'resuelto'); this.abrirPanel(); },
    accionEliminar: async function(id) { if(confirm("¿Borrar?")) { await logic.eliminarReporte(id); this.abrirPanel(); } }
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formIncidencia');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Recolectamos solo los datos existentes
            const datos = {
                problema: document.getElementById('p').value, // Ahora toma el valor del Select
                ubicacion: document.getElementById('u').value,
                desc: document.getElementById('d').value,
                // Eliminamos la línea de prioridad aquí
                prioridad: "N/A" // Enviamos un valor por defecto para no romper el Backend
            };

            await logic.agregarReporte(datos);
            alert("✅ Reporte registrado exitosamente.");
            
            form.reset();
            ui.showSection('view-home');
        });
    }
});