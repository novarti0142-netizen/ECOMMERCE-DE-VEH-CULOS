document.addEventListener('DOMContentLoaded', () => {
    let vehiclesData = [];
    let cart = [];

    const loadVehicles = async () => {
        try {
            const response = await fetch('https://raw.githubusercontent.com/JUANCITOPENA/Pagina_Vehiculos_Ventas/refs/heads/main/vehiculos.json');
            if (!response.ok) throw new Error('Error al cargar los datos');
            vehiclesData = await response.json();
            displayVehicles(vehiclesData);
        } catch (error) {
            document.getElementById('productsContainer').innerHTML = '<p class="text-center text-danger">Error al cargar los vehículos. Inténtalo de nuevo.</p>';
        } finally {
            document.getElementById('loadingSpinner').style.display = 'none';
        }
    };

    const displayVehicles = (vehicles) => {
        const container = document.getElementById('productsContainer');
        container.innerHTML = '';
        vehicles.forEach(vehicle => {
            const card = document.createElement('div');
            card.className = 'col-md-4 col-sm-6 mb-4';
            card.innerHTML = `
                <div class="card h-100">
                    <img src="${vehicle.imagen}" class="card-img-top" alt="${vehicle.marca} ${vehicle.modelo}" loading="lazy">
                    <div class="card-body">
                        <h5 class="card-title">${vehicle.marca} ${vehicle.modelo}</h5>
                        <p class="card-text">${vehicle.categoria} - ${vehicle.tipo.replace(/[\u{1F600}-\u{1F64F}]/gu, '')}</p>
                        <p class="card-text fw-bold">$${vehicle.precio_venta.toLocaleString()}</p>
                        <div>
                            <button class="btn btn-outline-primary me-2 viewDetailsBtn" data-codigo="${vehicle.codigo}">Ver Detalles</button>
                            <button class="btn btn-primary addToCartBtn" data-codigo="${vehicle.codigo}">Añadir al Carrito</button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
        addEventListeners();
    };

    const addEventListeners = () => {
        document.getElementById('productsContainer').addEventListener('click', (e) => {
            if (e.target.classList.contains('viewDetailsBtn')) {
                const codigo = parseInt(e.target.dataset.codigo);
                const vehicle = vehiclesData.find(v => v.codigo === codigo);
                showDetailsModal(vehicle);
            } else if (e.target.classList.contains('addToCartBtn')) {
                const codigo = parseInt(e.target.dataset.codigo);
                const vehicle = vehiclesData.find(v => v.codigo === codigo);
                showQuantityModal(vehicle);
            }
        });
    };

    const showDetailsModal = (vehicle) => {
        document.getElementById('modalImage').src = vehicle.imagen;
        document.getElementById('modalDetails').innerHTML = `
            <li class="list-group-item"><strong>Marca:</strong> ${vehicle.marca}</li>
            <li class="list-group-item"><strong>Modelo:</strong> ${vehicle.modelo}</li>
            <li class="list-group-item"><strong>Categoría:</strong> ${vehicle.categoria}</li>
            <li class="list-group-item"><strong>Tipo:</strong> ${vehicle.tipo.replace(/[\u{1F600}-\u{1F64F}]/gu, '')}</li>
            <li class="list-group-item"><strong>Precio:</strong> $${vehicle.precio_venta.toLocaleString()}</li>
        `;
        document.getElementById('modalAddToCartBtn').dataset.codigo = vehicle.codigo;
        new bootstrap.Modal(document.getElementById('detailsModal')).show();
    };

    const showQuantityModal = (vehicle) => {
        document.getElementById('quantityInput').value = 1;
        document.getElementById('addToCartBtn').onclick = () => {
            const quantity = parseInt(document.getElementById('quantityInput').value);
            if (quantity > 0) {
                addItemToCart(vehicle, quantity);
                bootstrap.Modal.getInstance(document.getElementById('quantityModal')).hide();
            }
        };
        new bootstrap.Modal(document.getElementById('quantityModal')).show();
    };

    const addItemToCart = (vehicle, quantity) => {
        const existingItem = cart.find(item => item.codigo === vehicle.codigo);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                imagen: vehicle.imagen,
                logo: vehicle.logo,
                codigo: vehicle.codigo,
                marca: vehicle.marca,
                modelo: vehicle.modelo,
                precio: vehicle.precio_venta,
                quantity
            });
        }
        updateCartUI();
    };

    const updateCartUI = () => {
        const cartItemsContainer = document.getElementById('cartItems');
        cartItemsContainer.innerHTML = '';
        let total = 0;
        cart.forEach(item => {
            const subtotal = item.precio * item.quantity;
            total += subtotal;
            const itemElement = document.createElement('p');
            itemElement.innerHTML = `
                <img src="${item.logo}" alt="${item.marca}" style="width: 30px; height: 30px;"> 
                <img src="${item.imagen}" alt="${item.marca} ${item.modelo}" style="width: 50px; height: 30px;"> 
                ${item.marca} ${item.modelo} - Cantidad: ${item.quantity} - Subtotal: $${subtotal.toLocaleString()}
            `;
            cartItemsContainer.appendChild(itemElement);
        });
        document.getElementById('cartTotal').textContent = total.toLocaleString();
        document.getElementById('cartCount').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    };

    const filterVehicles = () => {
        const query = document.getElementById('searchInput').value.toLowerCase();
        const filtered = vehiclesData.filter(vehicle =>
            vehicle.marca.toLowerCase().includes(query) ||
            vehicle.modelo.toLowerCase().includes(query) ||
            vehicle.categoria.toLowerCase().includes(query)
        );
        displayVehicles(filtered);
    };

    document.getElementById('searchInput').addEventListener('input', filterVehicles);

    document.getElementById('processPaymentBtn').addEventListener('click', () => {
        alert('Pago procesado exitosamente.');
        generateInvoice();
        cart = [];
        updateCartUI();
        bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
        bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
    });

    const generateInvoice = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Encabezado estilizado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(0, 102, 204); // Azul
    doc.text('Factura de Compra - Garage Online', 105, 20, { align: 'center' });

    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(10, 30, 200, 30);

    // Información del cliente
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Negro
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 10, 40);
    doc.text(`Nombre: ${document.getElementById('nameInput').value}`, 10, 50);

    // Línea separadora
    doc.line(10, 60, 200, 60);

    // Tabla de ítems usando autoTable
    const tableData = cart.map(item => [
        item.marca + ' ' + item.modelo,
        item.quantity,
        '$' + item.precio.toLocaleString(),
        '$' + (item.precio * item.quantity).toLocaleString()
    ]);

    doc.autoTable({
        head: [['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']],
        body: tableData,
        startY: 70,
        theme: 'striped', // Filas alternas
        headStyles: { fillColor: [0, 102, 204], textColor: 255 }, // Azul para encabezado
        styles: { fontSize: 10 },
        alternateRowStyles: { fillColor: [240, 240, 240] } // Gris claro para filas alternas
    });

    // Total resaltado
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 128, 0); // Verde
    doc.text(`Total: $${document.getElementById('cartTotal').textContent}`, 10, finalY);

    // Pie de página
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128); // Gris
    doc.text('Gracias por su compra en Garage Online. ¡Esperamos verle pronto!', 105, finalY + 20, { align: 'center' });

    doc.save('factura.pdf');
};

    loadVehicles();
});
