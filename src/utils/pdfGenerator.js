import jsPDF from 'jspdf';

export const generateTicketPDF = (ticketData) => {
  const doc = new jsPDF();

  // Configuration des couleurs
  const primaryColor = [102, 126, 234]; // Bleu
  const secondaryColor = [118, 75, 162]; // Violet
  const textColor = [51, 51, 51]; // Gris foncé

  // En-tête avec gradient simulé
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setFillColor(...secondaryColor);
  doc.rect(0, 30, 210, 10, 'F');

  // Logo et titre
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CENTI CRESCENDO', 105, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');

  // Solution pour l'emoji : soit le remplacer par une image, soit utiliser un symbole texte
  // Option 1: Utiliser un symbole texte simple
  doc.text('TICKET DE TOMBOLA OFFICIEL ★', 105, 30, { align: 'center' });

  // Option 2: Si vous voulez absolument un emoji, vous pouvez utiliser une police qui les supporte
  // (mais cela nécessite d'ajouter une police custom)

  // Informations du ticket
  doc.setTextColor(...textColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS DU PARTICIPANT', 20, 60);

  // Ligne de séparation
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1);
  doc.line(20, 65, 190, 65);

  // Détails du participant
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const details = [
    ['Nom complet:', ticketData.name],
    ['Numéro de téléphone:', ticketData.phone],
    ['Numéro de ticket:', ticketData.ticketNumber],
    ['Prix original:', `${ticketData.originalPrice} FCFA`],
    ['Prix payé:', `${ticketData.finalPrice} FCFA`],
    ['Date du tirage:', new Date(ticketData.drawDate).toLocaleDateString('fr-FR')],
    ['Tombola:', ticketData.tombolaTitle]
  ];

  // Ajouter les informations du coupon si applicable
  if (ticketData.couponCode && ticketData.discountAmount > 0) {
    details.splice(4, 0, ['Code coupon:', ticketData.couponCode]);
    details.splice(5, 0, ['Réduction appliquée:', `${ticketData.discountAmount} FCFA`]);
  }

  let yPosition = 80;
  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 80, yPosition);
    yPosition += 15;
  });

  // Encadré important
  doc.setFillColor(255, 248, 220);
  doc.rect(20, yPosition + 10, 170, 40, 'F');
  doc.setDrawColor(255, 193, 7);
  doc.setLineWidth(2);
  doc.rect(20, yPosition + 10, 170, 40);

  // Solution alternative pour le symbole d'avertissement
  doc.setTextColor(184, 134, 11);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('! IMPORTANT', 25, yPosition + 25); // Remplacement de l'emoji

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Conservez précieusement ce ticket jusqu\'au tirage.', 25, yPosition + 35);
  doc.text('Il constitue votre seule preuve de participation.', 25, yPosition + 45);

  // Pied de page
  yPosition += 70;
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  const generatedAt = ticketData.generatedAt ? new Date(ticketData.generatedAt).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR');
  doc.text('Généré automatiquement le ' + generatedAt, 105, yPosition, { align: 'center' });

  doc.setFontSize(8);
  doc.text('Centi Crescendo - Tombola Digitale Sécurisée', 105, yPosition + 10, { align: 'center' });

  // Motif décoratif (bordure en pointillés)
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  for (let i = 0; i < 210; i += 5) {
    doc.line(i, 5, i + 2, 5);
    doc.line(i, 290, i + 2, 290);
  }
  for (let i = 0; i < 297; i += 5) {
    doc.line(5, i, 5, i + 2);
    doc.line(205, i, 205, i + 2);
  }

  // Télécharger le PDF
  const fileName = `ticket-${ticketData.ticketNumber}.pdf`;
  doc.save(fileName);

  return fileName;
};

export const generateReceiptPDF = (receiptData) => {
  const doc = new jsPDF();

  // Configuration des couleurs
  const primaryColor = [102, 126, 234]; // Bleu
  const secondaryColor = [118, 75, 162]; // Violet
  const successColor = [34, 197, 94]; // Vert
  const textColor = [51, 51, 51]; // Gris foncé

  // En-tête avec gradient simulé
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setFillColor(...secondaryColor);
  doc.rect(0, 30, 210, 10, 'F');

  // Logo et titre
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CENTI CRESCENDO', 105, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('REÇU DE PAIEMENT DE COMMISSION', 105, 30, { align: 'center' });

  // Informations du reçu
  doc.setTextColor(...textColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉTAILS DU PAIEMENT', 20, 60);

  // Ligne de séparation
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1);
  doc.line(20, 65, 190, 65);

  // Numéro de reçu
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Numéro de reçu:', 20, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(receiptData.receiptNumber, 80, 80);

  // Date de paiement
  doc.setFont('helvetica', 'bold');
  doc.text('Date de paiement:', 20, 95);
  doc.setFont('helvetica', 'normal');
  doc.text(receiptData.paymentDate, 80, 95);

  // Informations du parrain
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS DU PARRAIN', 20, 115);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Nom:', 20, 130);
  doc.setFont('helvetica', 'normal');
  doc.text(receiptData.sponsorName, 80, 130);

  doc.setFont('helvetica', 'bold');
  doc.text('Téléphone:', 20, 145);
  doc.setFont('helvetica', 'normal');
  doc.text(receiptData.sponsorPhone, 80, 145);

  // Détails de la commission
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉTAILS DE LA COMMISSION', 20, 165);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Tombola:', 20, 180);
  doc.setFont('helvetica', 'normal');
  doc.text(receiptData.tombolaTitle, 80, 180);

  doc.setFont('helvetica', 'bold');
  doc.text('Tickets vendus:', 20, 195);
  doc.setFont('helvetica', 'normal');
  doc.text((parseInt(receiptData.commissionDetails.totalTickets) || 0).toString(), 80, 195);

  // Détail des commissions
  doc.setFont('helvetica', 'bold');
  doc.text('Commission de base:', 20, 210);
  doc.setFont('helvetica', 'normal');
  doc.text(`${parseFloat(receiptData.commissionDetails.baseCommission || 0).toLocaleString()} FCFA`, 80, 210);

  if (parseFloat(receiptData.commissionDetails.bonusCommission || 0) > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Bonus parrainage:', 20, 225);
    doc.setFont('helvetica', 'normal');
    doc.text(`${parseFloat(receiptData.commissionDetails.bonusCommission || 0).toLocaleString()} FCFA`, 80, 225);
  }

  // Montant total
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...successColor);
  doc.text('MONTANT TOTAL:', 20, 250);
  doc.text(`${parseFloat(receiptData.amount || 0).toLocaleString()} FCFA`, 80, 250);

  // Encadré de confirmation
  doc.setFillColor(220, 252, 231);
  doc.rect(20, 260, 170, 30, 'F');
  doc.setDrawColor(...successColor);
  doc.setLineWidth(2);
  doc.rect(20, 260, 170, 30);

  doc.setTextColor(...successColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('✓ PAIEMENT CONFIRMÉ', 25, 275);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Ce reçu atteste du paiement de la commission.', 25, 285);

  // Pied de page
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('Généré automatiquement le ' + receiptData.paymentDate, 105, 295, { align: 'center' });

  doc.setFontSize(8);
  doc.text('Centi Crescendo - Système de Commission Sécurisé', 105, 300, { align: 'center' });

  // Motif décoratif (bordure en pointillés)
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  for (let i = 0; i < 210; i += 5) {
    doc.line(i, 5, i + 2, 5);
    doc.line(i, 290, i + 2, 290);
  }
  for (let i = 0; i < 297; i += 5) {
    doc.line(5, i, 5, i + 2);
    doc.line(205, i, 205, i + 2);
  }

  // Télécharger le PDF
  const fileName = `recu-commission-${receiptData.receiptNumber}.pdf`;
  doc.save(fileName);

  return fileName;
};