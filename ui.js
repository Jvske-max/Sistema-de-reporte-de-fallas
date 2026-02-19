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

    validarLogin: function() { 
        if(document.getElementById('pass').value === "admin123") this.abrirPanel(); 
        else alert("Contrase"); 
    },

    accionAvanzar: async function(id, est) { 
        await logic.cambiarEstado(id, est === 'pendiente' ? 'proceso' : 'resuelto'); 
        this.abrirPanel(); 
    },

    accionEliminar: async function(id) { 
        if(confirm("¿Borrar?")) { 
            await logic.eliminarReporte(id); 
            this.abrirPanel(); 
        } 
    }
};

function validarContenidoOfensivo(texto) {
    // Lista de palabras no permitidas (puedes agregar las que necesites)
    const palabrasProhibidas = ["cumearon", "pene", "coño", "mamawebo", "puta", "mierda", "coño de tu madre", "imbécil", "idiota", "estúpido", "hijo de puta", "maricón", "zorra", "cabrón"];
    
    // Convertimos a minúsculas para una comparación uniforme
    const textoMinusculas = texto.toLowerCase();

    for (let palabra of palabrasProhibidas) {
        // La expresión \b busca la palabra exacta para evitar bloquear palabras 
        // legítimas que contienen la misma secuencia de letras.
        const regex = new RegExp(`\\b${palabra}\\b`, 'gi');
        if (regex.test(textoMinusculas)) {
            return true; // Se encontró contenido ofensivo
        }
    }
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formIncidencia');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const descripcion = document.getElementById('d').value;

            if (validarContenidoOfensivo(descripcion)) {
                alert("🚫 El reporte contiene lenguaje inapropiado y no puede ser enviado.");
                return; 
            }
            
            const datos = {
                problema: document.getElementById('p').value,
                ubicacion: document.getElementById('u').value,
                desc: descripcion,
                prioridad: "N/A"
            };

            try {
                await logic.agregarReporte(datos);

                alert("✅ Reporte registrado exitosamente.");
                form.reset();
                ui.showSection('view-home');
            } catch (error) {
                alert("🚫 Error: " + error.message);
            }
        });
    }
});