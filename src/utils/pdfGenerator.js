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
    ['Prix original:', `${ticketData.originalPrice || ticketData.price} FCFA`],
    ['Prix payé:', `${ticketData.price} FCFA`],
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
  doc.text('Généré automatiquement le ' + new Date().toLocaleString('fr-FR'), 105, yPosition, { align: 'center' });

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