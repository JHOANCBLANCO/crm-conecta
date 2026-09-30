const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed con estados de Back Office y bloqueo concurrente...');

  // Limpiar tablas previas
  await prisma.auditLog.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.user.deleteMany();

  // 1. Crear Campañas
  const campMovistar = await prisma.campaign.create({
    data: {
      id: 'camp_movistar',
      name: 'Campaña Movistar',
      description: 'Planes de Fibra Óptica, Televisión y Telefonía Móvil Pospago Movistar.',
      color: '#0284c7',
      isArchived: false,
    },
  });

  const campWom = await prisma.campaign.create({
    data: {
      id: 'camp_wom',
      name: 'Campaña WOM',
      description: 'Planes de telefonía móvil prepago, pospago y fibra óptica residencial WOM.',
      color: '#7c3aed',
      isArchived: false,
    },
  });

  const campClaro = await prisma.campaign.create({
    data: {
      id: 'camp_claro',
      name: 'Campaña Claro',
      description: 'Portafolio residencial y corporativo Claro Soluciones.',
      color: '#dc2626',
      isArchived: true,
    },
  });

  console.log('✅ Campañas creadas');

  // 2. Crear Usuarios con Cédula Consultor y usuario primer_nombre.primer_apellido
  const admin = await prisma.user.create({
    data: {
      id: 'usr_admin_1',
      cedula: '79890123',
      name: 'Jhoan Castiblanco',
      email: 'jhoan.castiblanco',
      password: 'admin',
      role: 'ADMIN',
      createdAt: new Date('2025-10-01T08:00:00Z'),
    },
  });

  const asesor1 = await prisma.user.create({
    data: {
      id: 'usr_asesor_1',
      cedula: '1019045892',
      name: 'Derly Fester',
      email: 'derly.fester',
      password: '123',
      role: 'ASESOR',
      createdAt: new Date('2025-12-01T08:00:00Z'),
      assignedCampaigns: {
        connect: [{ id: campMovistar.id }],
      },
    },
  });

  const asesor2 = await prisma.user.create({
    data: {
      id: 'usr_asesor_2',
      cedula: '1022983410',
      name: 'Mariana Rodriguez',
      email: 'mariana.rodriguez',
      password: '123',
      role: 'ASESOR',
      createdAt: new Date(),
      assignedCampaigns: {
        connect: [{ id: campWom.id }],
      },
    },
  });

  const backoffice1 = await prisma.user.create({
    data: {
      id: 'usr_backoffice_1',
      cedula: '52890412',
      name: 'Gabriela Castiblanco',
      email: 'gabriela.castiblanco',
      password: '123',
      role: 'BACKOFFICE',
      createdAt: new Date('2025-11-15T08:00:00Z'),
      assignedCampaigns: {
        connect: [{ id: campMovistar.id }, { id: campWom.id }],
      },
    },
  });

  const backoffice2 = await prisma.user.create({
    data: {
      id: 'usr_backoffice_2',
      cedula: '80123987',
      name: 'Alan Rodriguez',
      email: 'alan.rodriguez',
      password: '123',
      role: 'BACKOFFICE',
      createdAt: new Date('2025-11-20T08:00:00Z'),
      assignedCampaigns: {
        connect: [{ id: campMovistar.id }, { id: campWom.id }],
      },
    },
  });

  console.log('✅ Usuarios creados con cédula de consultor y 2 perfiles de Back Office');

  // 3. Crear Planes
  const planMovi1 = await prisma.plan.create({
    data: {
      id: 'plan_movi_1',
      campaignId: campMovistar.id,
      name: 'Fibra Óptica 300 Megas Simétricas',
      price: 69900,
      features: '300 Megas simétricas, Wifi Pro, Telefonía local ilimitada',
    },
  });

  const planMovi2 = await prisma.plan.create({
    data: {
      id: 'plan_movi_2',
      campaignId: campMovistar.id,
      name: 'Dúo Fibra 500 Megas + TV Digital',
      price: 99900,
      features: '500 Megas velocidad, 85 canales HD, App Movistar TV',
    },
  });

  const planWom1 = await prisma.plan.create({
    data: {
      id: 'plan_wom_1',
      campaignId: campWom.id,
      name: 'Pospago Imparable 100GB',
      price: 39900,
      features: '100 Gigas de navegación, Redes sociales libres, Minutos ilimitados',
    },
  });

  const planWom2 = await prisma.plan.create({
    data: {
      id: 'plan_wom_2',
      campaignId: campWom.id,
      name: 'Fibra WOM 400 Megas',
      price: 54900,
      features: '400 Megas simétrica, Router Dual Band, Instalación sin costo',
    },
  });

  console.log('✅ Planes creados');

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const todayStr = now.toISOString().slice(0, 10);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const currentMonthName = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(now);
  const formattedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  // Venta 1: Estado ACTIVO (Hoy)
  const sale1 = await prisma.sale.create({
    data: {
      campaignId: campMovistar.id,
      planId: planMovi1.id,
      advisorId: asesor1.id,
      validatorId: backoffice1.id,
      backofficeName: backoffice1.name,
      documentType: 'Cédula',
      clientCedula: '1018459201',
      clientName: 'Juan Fernando Restrepo',
      legalRepCedula: '',
      address: 'Cra 45 # 128 - 34 Apto 402',
      neighborhood: 'Prado Veraniego',
      department: 'Cundinamarca',
      city: 'Bogotá D.C.',
      contactName: 'Juan Restrepo',
      clientPhone: '3104567890',
      contactPhone2: '3119876543',
      clientEmail: 'juan.restrepo@gmail.com',
      otMin: '89045123',
      acquiredServices: 'Fibra Óptica 300 Megas Simétricas',
      recurrent: 'Mensual',
      saleValue: 69900,
      nip: '45892',
      contractNumber: 'CNT-2026-001',
      contractType: 'Firmado',
      validationMethod: 'ID Visión',
      identityValidationDate: todayStr,
      otpLine: '3104567890',
      otpCode: '784512',
      saleType: 'Línea Nueva',
      originOperator: 'Claro',
      salesChannel: 'WhatsApp',
      databaseName: 'BASE_MOVISTAR_HOGAR_SEP',
      externalId: 'ID-9901',
      observation: 'Cliente solicita instalación en horario de la mañana.',
      stage: 'ACTIVO',
      radicado: 'RAD-MOV-88201',
      preactivationDate: todayStr,
      simSentDate: todayStr,
      activationDate: todayStr,
      activationMonth: formattedMonth,
      backofficeObservation: 'Servicio activo y verificado en plataforma. SIM entregada y línea operando.',
      documentUrl: '/sample-docs/cedula_ejemplo_1.svg',
      documentName: 'cedula_juan_restrepo.svg',
      documentCedulaUrl: '/sample-docs/cedula_ejemplo_1.svg',
      documentCedulaName: 'cedula_juan_restrepo.svg',
      documentUtilityUrl: '/sample-docs/servicio_publico_ejemplo_1.svg',
      documentUtilityName: 'factura_energia_gas.svg',
      createdAt: now,
    },
  });

  await prisma.auditLog.create({
    data: {
      saleId: sale1.id,
      userId: backoffice1.id,
      action: 'ACTIVO',
      comment: 'Radicado RAD-MOV-88201 activado exitosamente por Gabriela Castiblanco.',
    },
  });

  // Venta 2: Estado PENDIENTE_BACKOFFICE (Hoy)
  await prisma.sale.create({
    data: {
      campaignId: campMovistar.id,
      planId: planMovi2.id,
      advisorId: asesor1.id,
      documentType: 'NIT',
      clientCedula: '9014582910',
      clientName: 'Inversiones Comerciales Castro S.A.S.',
      legalRepCedula: '1022394851',
      address: 'Av El Dorado # 68B - 85 Oficina 304',
      neighborhood: 'Salitre',
      department: 'Cundinamarca',
      city: 'Bogotá D.C.',
      contactName: 'Diana Marcela Castro',
      clientPhone: '3157891234',
      contactPhone2: '6014567890',
      clientEmail: 'gerencia@inversionescastro.com',
      otMin: '99123456',
      acquiredServices: 'Dúo Fibra 500 Megas + TV Digital',
      recurrent: 'Mensual',
      saleValue: 99900,
      nip: '90811',
      contractNumber: 'CNT-2026-002',
      contractType: 'Venta Digital',
      validationMethod: 'Venta Digital',
      identityValidationDate: todayStr,
      otpLine: '3157891234',
      otpCode: '332190',
      saleType: 'Portabilidad',
      originOperator: 'Tigo',
      salesChannel: 'Telemercadeo',
      databaseName: 'BASE_PYMES_BOGOTA',
      externalId: 'ID-9902',
      observation: 'Empresa requiere factura electrónica.',
      stage: 'PENDIENTE_BACKOFFICE',
      documentUrl: '/sample-docs/cedula_ejemplo_2.svg',
      documentName: 'cedula_diana_castro.svg',
      documentCedulaUrl: '/sample-docs/cedula_ejemplo_2.svg',
      documentCedulaName: 'cedula_diana_castro.svg',
      documentUtilityUrl: '/sample-docs/servicio_publico_ejemplo_1.svg',
      documentUtilityName: 'recibo_acueducto.svg',
      createdAt: now,
    },
  });

  // Venta 3: Estado PREACTIVO (Hoy - tomada por Camilo Rojas)
  await prisma.sale.create({
    data: {
      campaignId: campMovistar.id,
      planId: planMovi1.id,
      advisorId: asesor1.id,
      validatorId: backoffice2.id,
      backofficeName: backoffice2.name,
      lockedById: backoffice2.id,
      lockedByName: backoffice2.name,
      lockedAt: now,
      documentType: 'Cédula',
      clientCedula: '80234912',
      clientName: 'Santiago Alejandro Vargas',
      legalRepCedula: '',
      address: 'Calle 85 # 15 - 28 Apto 501',
      neighborhood: 'Chicó Norte',
      department: 'Cundinamarca',
      city: 'Bogotá D.C.',
      contactName: 'Santiago Vargas',
      clientPhone: '3168901234',
      contactPhone2: '3168905678',
      clientEmail: 'santiago.vargas@empresa.co',
      otMin: '66543210',
      acquiredServices: 'Fibra Óptica 300 Megas Simétricas',
      recurrent: 'Mensual',
      saleValue: 69900,
      nip: '55412',
      contractNumber: 'CNT-2026-004',
      contractType: 'Firmado',
      validationMethod: 'Claro Safe',
      identityValidationDate: todayStr,
      otpLine: '3168901234',
      otpCode: '112233',
      saleType: 'Portabilidad',
      originOperator: 'Claro',
      salesChannel: 'WhatsApp',
      databaseName: 'BASE_NORTE_BOG',
      externalId: 'ID-9904',
      observation: 'Portabilidad programada.',
      stage: 'PREACTIVO',
      radicado: 'RAD-MOV-88299',
      preactivationDate: todayStr,
      backofficeObservation: 'En proceso de preactivación en plataforma nacional.',
      documentUrl: '/sample-docs/cedula_ejemplo_1.svg',
      documentName: 'cedula_santiago.svg',
      documentCedulaUrl: '/sample-docs/cedula_ejemplo_1.svg',
      documentCedulaName: 'cedula_santiago.svg',
      documentUtilityUrl: '/sample-docs/servicio_publico_ejemplo_1.svg',
      documentUtilityName: 'servicio_publico.svg',
      createdAt: now,
    },
  });

  // Venta 4: Estado ENVIO_SIM (Ayer - con Biométrico)
  await prisma.sale.create({
    data: {
      campaignId: campWom.id,
      planId: planWom1.id,
      advisorId: asesor2.id,
      validatorId: backoffice1.id,
      backofficeName: backoffice1.name,
      documentType: 'Cédula',
      clientCedula: '52901234',
      clientName: 'Laura Patricia Morales',
      legalRepCedula: '',
      address: 'Cra 70 # 44 - 12',
      neighborhood: 'Laureles',
      department: 'Antioquia',
      city: 'Medellín',
      contactName: 'Laura Morales',
      clientPhone: '3205678901',
      contactPhone2: '3205678902',
      clientEmail: 'laura.morales@gmail.com',
      otMin: '44556677',
      acquiredServices: 'Pospago Imparable 100GB',
      recurrent: 'Mensual',
      saleValue: 39900,
      nip: '77889',
      contractNumber: 'CNT-2026-005',
      contractType: 'Venta Digital',
      validationMethod: 'Biométrico',
      identityValidationDate: yesterdayStr,
      otpLine: '3205678901',
      otpCode: '998877',
      saleType: 'Portabilidad',
      originOperator: 'Movistar',
      salesChannel: 'Redes Sociales',
      databaseName: 'BASE_WOM_ANTIOQUIA',
      externalId: 'ID-9905',
      observation: 'Entregar SIM en portería.',
      stage: 'ENVIO_SIM',
      radicado: 'RAD-WOM-45102',
      preactivationDate: yesterdayStr,
      simSentDate: yesterdayStr,
      backofficeObservation: 'SIM despachada por transportadora con guía #998123.',
      documentUrl: '/sample-docs/cedula_ejemplo_2.svg',
      documentName: 'cedula_laura.svg',
      documentCedulaUrl: '/sample-docs/cedula_ejemplo_2.svg',
      documentCedulaName: 'cedula_laura.svg',
      documentUtilityUrl: '/sample-docs/servicio_publico_ejemplo_1.svg',
      documentUtilityName: 'recibo_epm.svg',
      createdAt: yesterday,
    },
  });

  // Venta 5: Estado DEVOLUCION (Ayer)
  await prisma.sale.create({
    data: {
      campaignId: campMovistar.id,
      planId: planMovi1.id,
      advisorId: asesor1.id,
      validatorId: backoffice1.id,
      backofficeName: backoffice1.name,
      documentType: 'Cédula',
      clientCedula: '79845123',
      clientName: 'Rodrigo Alberto Peña',
      legalRepCedula: '',
      address: 'Calle 10 # 15 - 22',
      neighborhood: 'Centro',
      department: 'Valle del Cauca',
      city: 'Cali',
      contactName: 'Rodrigo Peña',
      clientPhone: '3001234567',
      contactPhone2: '3007654321',
      clientEmail: 'rodrigo.pena@outlook.com',
      otMin: '77451290',
      acquiredServices: 'Fibra Óptica 300 Megas Simétricas',
      recurrent: 'Mensual',
      saleValue: 69900,
      nip: '11234',
      contractNumber: 'CNT-2026-003',
      contractType: 'Grabado',
      validationMethod: 'Claro Safe',
      identityValidationDate: yesterdayStr,
      otpLine: '3001234567',
      otpCode: '659012',
      saleType: 'Migración',
      originOperator: 'ETB',
      salesChannel: 'Base de Datos',
      databaseName: 'BASE_SUR_MIGRACION',
      externalId: 'ID-9903',
      observation: 'Cliente migra de prepago a plan hogar.',
      stage: 'DEVOLUCION',
      radicado: 'RAD-MOV-88150',
      backofficeObservation: 'Recibo de servicio público vencido o no legible la dirección.',
      returnReason: 'Recibo de servicio público vencido o no legible la dirección.',
      documentUrl: '/sample-docs/cedula_ejemplo_3.svg',
      documentName: 'cedula_rodrigo_pena.svg',
      documentCedulaUrl: '/sample-docs/cedula_ejemplo_3.svg',
      documentCedulaName: 'cedula_rodrigo_pena.svg',
      documentUtilityUrl: '/sample-docs/servicio_publico_ejemplo_1.svg',
      documentUtilityName: 'recibo_servicio.svg',
      createdAt: yesterday,
    },
  });

  console.log('Ventas iniciales registradas');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
