// Espera a que el DOM esté completamente cargado antes de ejecutar el script
document.addEventListener('DOMContentLoaded', () => {

    // =============================================
    // VARIABLES GLOBALES Y SELECTORES
    // =============================================
    const JSON_URL = 'https://raw.githubusercontent.com/JUANCITOPENA/Pagina_Vehiculos_Ventas/refs/heads/main/vehiculos.json';
    let vehiclesData = []; // Almacén para todos los vehículos
    let cart = []; // Almacén para el carrito

    // Selectores del DOM
    const productsContainer = document.getElementById('productsContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const searchInput = document.getElementById('searchInput');
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const processPaymentBtn = document.getElementById('processPaymentBtn');
    
    // Instancias de Modales de Bootstrap (se inicializarán cuando se necesiten)
    let quantityModalInstance, cartModalInstance, paymentModalInstance, detailModalInstance;

    // Selectores de modales (elementos)
    const quantityModalEl = document.getElementById('quantityModal');
    const cartModalEl = document.getElementById('cartModal');
    const paymentModalEl = document.getElementById('paymentModal');
    const vehicleDetailModalEl = document.getElementById('vehicleDetailModal');

    // Selectores de elementos dentro de los modales
    const quantityInput = document.getElementById('quantityInput');
    const addToCartBtn = document.getElementById('addToCartBtn'); // Botón "Añadir" en modal cantidad
    const detailImage = document.getElementById('detailImage');
    const detailInfo = document.getElementById('detailInfo');
    const addToCartFromDetailBtn = document.getElementById('addToCartFromDetailBtn');


    // =============================================
    // FUNCIONES PRINCIPALES
    // =============================================

    /**
     * 1. Carga los datos de vehículos desde el JSON usando fetch y async/await.
     */
    async function loadVehicles() {
        showSpinner();
        try {
            const response = await fetch(JSON_URL);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            vehiclesData = await response.json();
            displayVehicles(vehiclesData); // Muestra todos los vehículos al cargar
        } catch (error) {
            console.error('Error al cargar los vehículos:', error);
            productsContainer.innerHTML = `<p class="text-center text-danger">No se pudieron cargar los vehículos. Por favor, intente más tarde.</p>`;
        } finally {
            hideSpinner();
        }
    }

    /**
     * 2. Muestra los vehículos en el DOM.
     * @param {Array} vehicles - El array de vehículos a mostrar.
     */
    function displayVehicles(vehicles) {
        productsContainer.innerHTML = ''; // Limpia el contenedor

        if (vehicles.length === 0) {
            productsContainer.innerHTML = `<p class="text-center text-muted">No se encontraron vehículos que coincidan con su búsqueda.</p>`;
            return;
        }

        vehicles.forEach(vehicle => {
            // Limpia el campo 'tipo' de emojis
            const cleanTipo = vehicle.tipo.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

            const cardHTML = `
                <div class="col-lg-4 col-md-6 mb-4">
                    <div class="card h-100" role="article" aria-labelledby="title-${vehicle.codigo}">
                        <img src="${vehicle.imagen}" class="card-img-top" alt="${vehicle.marca} ${vehicle.modelo}" loading="lazy">
                        <div class="card-body">
                            <h5 class="card-title" id="title-${vehicle.codigo}">${vehicle.marca} ${vehicle.modelo}</h5>
                            <p class="card-text category text-muted">${vehicle.categoria} | ${cleanTipo}</p>
                            <p class="card-text price">${formatPrice(vehicle.precio_venta)}</p>
                        </div>
                        <div class="card-footer">
                            <button class="btn btn-outline-secondary btn-sm viewDetailsBtn" data-codigo="${vehicle.codigo}" aria-label="Ver detalles de ${vehicle.marca} ${vehicle.modelo}">
                                <i class="fas fa-eye"></i> Ver Detalles
                            </button>
                            <button class="btn btn-primary btn-sm addToCartBtn" data-codigo="${vehicle.codigo}" aria-label="Añadir ${vehicle.marca} ${vehicle.modelo} al carrito">
                                <i class="fas fa-cart-plus"></i> Añadir al Carrito
                            </button>
                        </div>
                    </div>
                </div>
            `;
            productsContainer.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    /**
     * 3. Filtra los vehículos basados en la entrada de búsqueda.
     */
    function filterVehicles() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filtered = vehiclesData.filter(vehicle => 
            vehicle.marca.toLowerCase().includes(searchTerm) ||
            vehicle.modelo.toLowerCase().includes(searchTerm) ||
            vehicle.categoria.toLowerCase().includes(searchTerm)
        );
        displayVehicles(filtered);
    }

    /**
     * 4. Maneja los clics en el contenedor de productos (Delegación de eventos).
     * @param {Event} e - El objeto del evento click.
     */
    function handleProductClick(e) {
        const viewBtn = e.target.closest('.viewDetailsBtn');
        const addBtn = e.target.closest('.addToCartBtn');

        if (viewBtn) {
            const codigo = viewBtn.dataset.codigo;
            const vehicle = findVehicleByCodigo(codigo);
            if (vehicle) {
                showDetailModal(vehicle);
            }
        }

        if (addBtn) {
            const codigo = addBtn.dataset.codigo;
            const vehicle = findVehicleByCodigo(codigo);
            if (vehicle) {
                showQuantityModal(vehicle);
            }
        }
    }

    /**
     * 5. Muestra el modal de detalles del vehículo.
     * @param {Object} vehicle - El objeto del vehículo seleccionado.
     */
    function showDetailModal(vehicle) {
        if (!detailModalInstance) {
            detailModalInstance = new bootstrap.Modal(vehicleDetailModalEl);
        }

        // Poblar el modal
        detailImage.src = vehicle.imagen;
        detailImage.alt = `${vehicle.marca} ${vehicle.modelo}`;
        vehicleDetailModalEl.querySelector('.modal-title').textContent = `${vehicle.marca} ${vehicle.modelo}`;
        
        const cleanTipo = vehicle.tipo.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

        // --- INICIO DE LA MODIFICACIÓN ---
        // Aquí se agregó la línea para "Combustible"
        detailInfo.innerHTML = `
            <ul class="list-group list-group-flush">
                <li class="list-group-item"><strong>Precio:</strong> ${formatPrice(vehicle.precio_venta)}</li>
                <li class="list-group-item"><strong>Categoría:</strong> ${vehicle.categoria}</li>
                <li class="list-group-item"><strong>Tipo:</strong> ${cleanTipo}</li>
                <li class="list-group-item"><strong>Año:</strong> ${vehicle.año}</li>
                <li class="list-group-item"><strong>Kilometraje:</strong> ${vehicle.kilometraje.toLocaleString('es-ES')} km</li>
                <li class="list-group-item"><strong>Transmisión:</strong> ${vehicle.transmision}</li>
                <li class="list-group-item"><strong>Combustible:</strong> ${vehicle.combustible}</li>
            </ul>
        `;
        // --- FIN DE LA MODIFICACIÓN ---

        // Asignar el código al botón "Añadir al Carrito" del modal de detalles
        addToCartFromDetailBtn.dataset.codigo = vehicle.codigo;

        detailModalInstance.show();
    }

    /**
     * 6. Muestra el modal de cantidad.
     * @param {Object} vehicle - El objeto del vehículo a añadir.
     */
    function showQuantityModal(vehicle) {
        if (!quantityModalInstance) {
            quantityModalInstance = new bootstrap.Modal(quantityModalEl);
        }

        quantityInput.value = 1; // Resetea la cantidad

        // Clave: Para evitar listeners duplicados, removemos el anterior y añadimos uno nuevo.
        // La forma más segura es reemplazar el nodo del botón.
        const newAddToCartBtn = addToCartBtn.cloneNode(true);
        addToCartBtn.parentNode.replaceChild(newAddToCartBtn, addToCartBtn);
        // 'addToCartBtn' ahora apunta al nodo huérfano, así que re-seleccionamos el nuevo.
        const currentAddToCartBtn = document.getElementById('addToCartBtn');

        currentAddToCartBtn.addEventListener('click', () => {
            const quantity = parseInt(quantityInput.value);
            if (quantity > 0) {
                addItemToCart(vehicle, quantity);
                quantityModalInstance.hide();
            } else {
                alert('Por favor, ingrese una cantidad válida (mayor a 0).');
            }
        });

        quantityModalInstance.show();
    }

    /**
     * 7. Añade un ítem al carrito o actualiza su cantidad.
     * @param {Object} vehicle - El vehículo a añadir.
     * @param {number} quantity - La cantidad a añadir.
     */
    function addItemToCart(vehicle, quantity) {
        const existingItem = cart.find(item => item.codigo === vehicle.codigo);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                codigo: vehicle.codigo,
                marca: vehicle.marca,
                modelo: vehicle.modelo,
                precio_venta: vehicle.precio_venta,
                imagen: vehicle.imagen,
                logo: vehicle.logo, // Asumiendo que el JSON tiene 'logo'
                quantity: quantity
            });
        }
        updateCartUI();
    }

    /**
     * 8. Actualiza la UI del carrito (modal y contador).
     */
    function updateCartUI() {
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="text-center text-muted">Tu carrito está vacío.</p>';
        } else {
            cartItems.innerHTML = ''; // Limpia el contenedor del carrito
            cart.forEach(item => {
                const subtotal = item.precio_venta * item.quantity;
                const itemHTML = `
                    <div class="cart-item">
                        <img src="${item.logo || 'placeholder.png'}" alt="${item.marca} Logo" class="logo">
                        <img src="${item.imagen}" alt="${item.marca} ${item.modelo}" class="vehicle-img">
                        <div class="cart-item-info">
                            <h6>${item.marca} ${item.modelo}</h6>
                            <small class="text-muted">Cantidad: ${item.quantity} x ${formatPrice(item.precio_venta)}</small>
                        </div>
                        <div class="cart-item-subtotal">
                            ${formatPrice(subtotal)}
                        </div>
                    </div>
                `;
                cartItems.insertAdjacentHTML('beforeend', itemHTML);
            });
        }

        // Calcular total y actualizar contador
        const total = cart.reduce((acc, item) => acc + (item.precio_venta * item.quantity), 0);
        const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

        cartTotal.textContent = formatPrice(total);
        cartCount.textContent = totalItems;

        // Animación de pulso
        if (totalItems > 0) {
            cartCount.classList.add('pulse-animation');
            cartCount.addEventListener('animationend', () => {
                cartCount.classList.remove('pulse-animation');
            }, { once: true });
        }
    }

    /**
     * 9. Simula el procesamiento del pago y genera la factura PDF.
     */
    function processPayment() {
        // Validar formulario (simple)
        const name = document.getElementById('paymentName').value;
        const card = document.getElementById('paymentCard').value;
        if (!name || !card) {
            alert('Por favor, complete los campos del formulario de pago.');
            return;
        }

        alert('¡Pago procesado con éxito! Generando su factura...');

        // Generar factura
        generateInvoice();

        // Limpiar carrito
        cart = [];
        updateCartUI();

        // Ocultar modales
        if (!paymentModalInstance) paymentModalInstance = bootstrap.Modal.getInstance(paymentModalEl);
        if (!cartModalInstance) cartModalInstance = bootstrap.Modal.getInstance(cartModalEl);
        
        paymentModalInstance.hide();
        cartModalInstance.hide();

        // Resetear formulario de pago
        document.getElementById('paymentForm').reset();
    }

    /**
     * 10. Genera una factura en PDF con jsPDF.
     */
    function generateInvoice() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const customerName = document.getElementById('paymentName').value || "Cliente";
        const today = new Date().toLocaleDateString('es-ES');
        let yPos = 20;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('Factura - GarageOnline', 105, yPos, { align: 'center' });
        yPos += 15;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Fecha: ${today}`, 20, yPos);
        doc.text(`Cliente: ${customerName}`, 20, yPos + 7);
        yPos += 20;

        doc.setFont('helvetica', 'bold');
        doc.text('Vehículo', 20, yPos);
        doc.text('Cantidad', 120, yPos);
        doc.text('Precio Unit.', 150, yPos);
        doc.text('Subtotal', 180, yPos);
        yPos += 7;
        doc.line(20, yPos-2, 190, yPos-2); // Línea horizontal
        
        doc.setFont('helvetica', 'normal');
        let total = 0;

        cart.forEach(item => {
            const subtotal = item.quantity * item.precio_venta;
            total += subtotal;
            doc.text(`${item.marca} ${item.modelo}`, 20, yPos);
            doc.text(item.quantity.toString(), 125, yPos);
            doc.text(formatPrice(item.precio_venta), 150, yPos);
            doc.text(formatPrice(subtotal), 180, yPos);
            yPos += 7;
        });

        yPos += 5;
        doc.line(120, yPos, 190, yPos); // Línea horizontal
        yPos += 7;
        doc.setFont('helvetica', 'bold');
        doc.text('Total:', 150, yPos);
        doc.text(formatPrice(total), 180, yPos);

        doc.save(`factura_GarageOnline_${customerName.replace(' ', '_')}.pdf`);
    }

    // =============================================
    // FUNCIONES AUXILIARES
    // =============================================

    /**
     * Muestra el spinner de carga.
     */
    function showSpinner() {
        loadingSpinner.style.display = 'flex';
    }

    /**
     * Oculta el spinner de carga.
     */
    function hideSpinner() {
        loadingSpinner.style.display = 'none';
    }

    /**
     * Busca un vehículo por su código.
     * @param {string|number} codigo - El código del vehículo.
     * @returns {Object|undefined} El objeto del vehículo o undefined.
     */
    function findVehicleByCodigo(codigo) {
        return vehiclesData.find(v => v.codigo === parseInt(codigo));
    }

    /**
     * Formatea un número como moneda (USD, asumiendo que los precios son en dólares).
     * @param {number} price - El precio a formatear.
     * @returns {string} El precio formateado.
     */
    function formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(price);
    }


    // =============================================
    // INICIALIZACIÓN Y EVENT LISTENERS
    // =============================================

    // Carga inicial de vehículos
    loadVehicles();

    // Listener para la barra de búsqueda (evento 'input' para reacción inmediata)
    searchInput.addEventListener('input', filterVehicles);

    // Listener para el contenedor de productos (Delegación de eventos)
    productsContainer.addEventListener('click', handleProductClick);

    // Listener para el botón "Añadir al Carrito" DENTRO del modal de detalles
    addToCartFromDetailBtn.addEventListener('click', (e) => {
        const codigo = e.currentTarget.dataset.codigo;
        const vehicle = findVehicleByCodigo(codigo);
        if (vehicle) {
            // Cierra el modal de detalles antes de abrir el de cantidad
            if (!detailModalInstance) detailModalInstance = bootstrap.Modal.getInstance(vehicleDetailModalEl);
            detailModalInstance.hide();
            // Muestra el modal de cantidad
            showQuantityModal(vehicle);
        }
    });

    // Listener para el botón "Pagar" (abre el modal de pago)
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Tu carrito está vacío. Añade vehículos antes de pagar.');
            return;
        }
        
        if (!paymentModalInstance) {
            paymentModalInstance = new bootstrap.Modal(paymentModalEl);
        }
        paymentModalInstance.show();
        
        // Oculta el modal del carrito
        if (!cartModalInstance) cartModalInstance = bootstrap.Modal.getInstance(cartModalEl);
        cartModalInstance.hide();
    });

    // Listener para el botón "Procesar Pago"
    processPaymentBtn.addEventListener('click', processPayment);

});