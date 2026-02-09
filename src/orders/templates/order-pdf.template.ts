import * as fs from 'fs';
import * as path from 'path';

export const getOrderPdfTemplate = (order: any) => {
  const formatDate = (date: Date): string => {
    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const d = new Date(date);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const translateStatus = (status: string): string => {
    const translations: Record<string, string> = {
      PENDING: 'Pendiente',
      IN_TRANSIT: 'En Tránsito',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado',
    };
    return translations[status] || status;
  };

  const getStatusClass = (status: string): string => {
    const statusMap: Record<string, string> = {
      PENDING: 'status-pending',
      IN_TRANSIT: 'status-in-transit',
      DELIVERED: 'status-delivered',
      CANCELLED: 'status-cancelled',
    };
    return statusMap[status] || 'status-pending';
  };

  let logoDataUri = '';
  try {
    const logoPath = path.join(process.cwd(), 'src/assets/images/logo.svg');
    if (fs.existsSync(logoPath)) {
      const svgContent = fs.readFileSync(logoPath, 'utf-8');
      const base64 = Buffer.from(svgContent).toString('base64');
      logoDataUri = `data:image/svg+xml;base64,${base64}`;
    }
  } catch (error) {
    console.error('Error loading logo:', error);
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 12px;
      color: #333;
      padding: 40px;
      line-height: 1.5;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #000;
    }

    .logo {
      width: 150px;
      height: auto;
    }

    .order-number {
      font-size: 18px;
      font-weight: bold;
      color: #000;
    }

    .cancelled-badge {
      background: #ff0000;
      color: white;
      padding: 10px 20px;
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      margin: 0 0 20px 0;
    }

    .section {
      margin-bottom: 25px;
    }

    .section-title {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ddd;
      text-transform: uppercase;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 15px;
      margin-top: 15px;
      align-items: stretch;
    }

    .delivery-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px 10px;
    }

    .delivery-icon svg {
      width: 40px;
      height: 40px;
      fill: #42A5F5;
    }

    .info-box {
      padding: 15px;
      background: #f9f9f9;
      border-radius: 5px;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .info-box h3 {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #000;
    }

    .info-row {
      margin-bottom: 8px;
    }

    .info-dates {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-top: 10px;
    }

    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 11px;
      text-align: center;
      margin-top: 5px;
    }

    .status-pending {
      background: #FFA726;
      color: #fff;
    }

    .status-in-transit {
      background: #42A5F5;
      color: #fff;
    }

    .status-delivered {
      background: #66BB6A;
      color: #fff;
    }

    .status-cancelled {
      background: #EF5350;
      color: #fff;
    }

    .label {
      font-weight: bold;
      display: inline-block;
      width: 140px;
    }

    .package-item {
      background: #f9f9f9;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 15px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .package-section {
      display: flex;
      flex-direction: column;
    }

    .package-section:first-child {
      border-right: 1px solid #ddd;
      padding-right: 20px;
    }

    .package-title {
      font-weight: bold;
      margin-bottom: 10px;
      font-size: 11px;
      text-transform: uppercase;
      color: #666;
    }

    .package-description {
      font-size: 13px;
      line-height: 1.6;
    }

    .cost-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 15px;
    }

    .cost-box {
      padding: 15px;
      background: #f9f9f9;
      border-radius: 5px;
    }

    .cost-box-title {
      font-weight: bold;
      font-size: 12px;
      margin-bottom: 12px;
      text-transform: uppercase;
      color: #000;
    }

    .cost-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 11px;
    }

    .cost-total {
      background: #f0f0f0;
      padding: 15px;
      border-radius: 5px;
      margin-top: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cost-total-label {
      font-size: 16px;
      font-weight: bold;
      text-transform: uppercase;
    }

    .cost-total-amount {
      font-size: 20px;
      font-weight: bold;
      color: #000;
    }

    .note {
      font-size: 10px;
      color: #666;
      font-style: italic;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      ${logoDataUri ? `<img src="${logoDataUri}" class="logo" alt="Boxful Logo" />` : '<div style="font-size: 24px; font-weight: bold;">BOXFUL</div>'}
    </div>
    <div class="order-number">ORDEN #${order.id.slice(-6).toUpperCase()}</div>
  </div>

  ${order.status === 'CANCELLED' ? '<div class="cancelled-badge">ORDEN CANCELADA</div>' : ''}

  <div class="section">
    <div class="section-title">Información de la Orden</div>
    <div class="info-dates">
      <div>
        <span class="label">Fecha de creación:</span><br>
        ${formatDate(order.createdAt)}
      </div>
      <div>
        <span class="label">Fecha de entrega:</span><br>
        ${order.deliveredAt ? formatDate(order.deliveredAt) : '-'}
      </div>
      <div>
        <span class="label">Estado:</span><br>
        <div class="status-badge ${getStatusClass(order.status)}">
          ${translateStatus(order.status).toUpperCase()}
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Remitente y Destinatario</div>
    <div class="info-grid">
      <div class="info-box">
        <h3>REMITENTE</h3>
        <div class="info-row">${order.user.firstName} ${order.user.lastName}</div>
        <div class="info-row">+${order.user.whatsappCode} ${order.user.whatsappNumber}</div>
        <div class="info-row">${order.user.email}</div>
        <div class="info-row" style="margin-top: 10px;"><strong>Dirección de recolección:</strong></div>
        <div class="info-row">${order.pickupAddress}</div>
      </div>
      <div class="delivery-icon">
        <svg viewBox="64 64 896 896" focusable="false">
          <path d="M533.2 492.3L277.9 166.1c-3-3.9-7.7-6.1-12.6-6.1H188c-6.7 0-10.4 7.7-6.3 12.9L447.1 512 181.7 851.1A7.98 7.98 0 00188 864h77.3c4.9 0 9.6-2.3 12.6-6.1l255.3-326.1c9.1-11.7 9.1-27.9 0-39.5zm304 0L581.9 166.1c-3-3.9-7.7-6.1-12.6-6.1H492c-6.7 0-10.4 7.7-6.3 12.9L751.1 512 485.7 851.1A7.98 7.98 0 00492 864h77.3c4.9 0 9.6-2.3 12.6-6.1l255.3-326.1c9.1-11.7 9.1-27.9 0-39.5z"/>
        </svg>
      </div>
      <div class="info-box">
        <h3>DESTINATARIO</h3>
        <div class="info-row">${order.clientName}</div>
        <div class="info-row">${order.clientPhone}</div>
        ${order.clientEmail ? `<div class="info-row">${order.clientEmail}</div>` : ''}
        <div class="info-row" style="margin-top: 10px;"><strong>Dirección de entrega:</strong></div>
        <div class="info-row">${order.clientAddress}</div>
        <div class="info-row">${order.clientDepartment}, ${order.clientMunicipality}</div>
        ${order.clientReference ? `<div class="info-row"><em>Ref: ${order.clientReference}</em></div>` : ''}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Paquetes</div>
    ${order.packages
      .map(
        (pkg: any, index: number) => `
      <div style="margin-bottom: 10px;">
        <div style="font-weight: bold; margin-bottom: 8px; font-size: 12px;">Paquete #${index + 1}</div>
        <div class="package-item">
          <div class="package-section">
            <div class="package-title">Descripción</div>
            <div class="package-description">${pkg.description}</div>
          </div>
          <div class="package-section">
            <div class="package-title">Especificaciones</div>
            <div class="info-row"><span class="label">Dimensiones:</span> ${pkg.length}cm x ${pkg.height}cm x ${pkg.width}cm</div>
            <div class="info-row"><span class="label">Peso:</span> ${pkg.weight} lbs</div>
            <div class="info-row"><span class="label">Cantidad:</span> ${pkg.quantity} paquete(s)</div>
          </div>
        </div>
      </div>
    `,
      )
      .join('')}
  </div>

  <div class="section">
    <div class="section-title">Detalle de Costos</div>
    ${
      !order.isCOD
        ? `
      <div class="cost-grid">
        <div class="cost-box">
          <div class="cost-box-title">Costo de Envío</div>
          <div class="cost-row">
            <span>Costo de envío</span>
            <span>$${order.shippingCost?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
        <div></div>
      </div>
    `
        : order.status === 'DELIVERED'
          ? `
      <div class="cost-grid">
        <div class="cost-box">
          <div class="cost-box-title">Costo de Envío</div>
          <div class="cost-row">
            <span>Costo de envío</span>
            <span>$${order.shippingCost?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
        <div class="cost-box">
          <div class="cost-box-title">Pago Contra Entrega (PCE)</div>
          <div class="cost-row">
            <span>Monto esperado</span>
            <span>$${order.codExpectedAmount?.toFixed(2) || '0.00'}</span>
          </div>
          <div class="cost-row">
            <span>Monto cobrado</span>
            <span>$${order.codCollectedAmount?.toFixed(2) || '0.00'}</span>
          </div>
          <div class="cost-row">
            <span>Comisión PCE (0.01%)</span>
            <span>-$${order.codCommission?.toFixed(2) || '0.00'}</span>
          </div>
          <div class="cost-row">
            <span>Costo de envío</span>
            <span>-$${order.shippingCost?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      </div>
      <div class="cost-total">
        <span class="cost-total-label">Liquidación</span>
        <span class="cost-total-amount">$${order.settlementAmount?.toFixed(2) || '0.00'}</span>
      </div>
    `
          : `
      <div class="cost-grid">
        <div class="cost-box">
          <div class="cost-box-title">Costo de Envío</div>
          <div class="cost-row">
            <span>Costo de envío estimado</span>
            <span>$${order.shippingCost?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
        <div class="cost-box">
          <div class="cost-box-title">Pago Contra Entrega (PCE)</div>
          <div class="cost-row">
            <span>Monto a cobrar</span>
            <span>$${order.codExpectedAmount?.toFixed(2) || '0.00'}</span>
          </div>
          <div class="note">* Liquidación final disponible al completar la entrega</div>
        </div>
      </div>
    `
    }
  </div>
</body>
</html>
  `;
};
