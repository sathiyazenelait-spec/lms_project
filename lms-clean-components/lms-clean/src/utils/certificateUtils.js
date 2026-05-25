// /**
//  * Certificate PDF Download Utility
//  * This utility requires html2canvas and jsPDF to be installed
//  * Install with: npm install html2canvas jspdf
//  */

// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";

// export const downloadCertificateAsPDF = async (certificateRef, studentName, certificateId) => {
//   try {
//     // Dynamically import libraries (fallback if not installed)
//     // let html2canvas, jsPDF;
    
//     // try {
//     //   html2canvas = (await import('html2canvas')).default;
//     //   jsPDF = (await import('jspdf')).jsPDF;
//     // } catch (err) {
//     //   console.error('Required libraries not installed. Please install: npm install html2canvas jspdf');
//     //   alert('PDF export feature is not available. Please install required libraries.');
//     //   return;
//     // }

//     // Show loading state
//     const originalText = 'Generating PDF...';
//     const btn = document.activeElement;
//     if (btn) btn.disabled = true;

//     // Capture the certificate element as canvas
//     const canvas = await html2canvas(certificateRef, {
//       scale: 2,
//       allowTaint: true,
//       useCORS: true,
//       backgroundColor: '#1e3c72',
//       logging: false,
//     });

//     // Get dimensions
//     const imgData = canvas.toDataURL('image/png');
//     const imgWidth = 210; // A4 width in mm
//     const imgHeight = (canvas.height * imgWidth) / canvas.width;

//     // Create PDF
//     const pdf = new jsPDF({
//       orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
//       unit: 'mm',
//       format: 'a4',
//     });

//     const pageHeight = pdf.internal.pageSize.getHeight();
//     const pageWidth = pdf.internal.pageSize.getWidth();

//     // Calculate dimensions to fit page
//     let finalWidth = pageWidth;
//     let finalHeight = (canvas.height * finalWidth) / canvas.width;

//     if (finalHeight > pageHeight) {
//       finalHeight = pageHeight;
//       finalWidth = (canvas.width * finalHeight) / canvas.height;
//     }

//     const xOffset = (pageWidth - finalWidth) / 2;
//     const yOffset = (pageHeight - finalHeight) / 2;

//     // Add image to PDF
//     pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);

//     // Generate filename
//     const filename = `Certificate_${studentName.replace(/\s+/g, '_')}_${certificateId.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

//     // Download PDF
//     pdf.save(filename);

//     if (btn) {
//       btn.disabled = false;
//     }

//     return filename;
//   } catch (error) {
//     console.error('Error generating PDF:', error);
//     alert('Error generating PDF. Please try again.');
//     const btn = document.activeElement;
//     if (btn) btn.disabled = false;
//   }
// };

// /**
//  * Alternative: Canvas-based PDF generation (lightweight, no external dependencies)
//  * This creates a simpler PDF without the certificate template preview
//  */
// export const generateCertificatePDFSimple = (certificate) => {
//   try {

//     const pdf = new jsPDF({
//       orientation: 'landscape',
//       unit: 'mm',
//       format: 'a4',
//     });

//     const pageWidth = pdf.internal.pageSize.getWidth();
//     const pageHeight = pdf.internal.pageSize.getHeight();
//     const margin = 20;

//     let yPosition = margin;
//     const lineHeight = 7;
//     const textWidth = pageWidth - 2 * margin;

//     // Title
//     pdf.setFontSize(32);
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('CERTIFICATE', pageWidth / 2, yPosition, {
//       align: 'center'
//     });

//     yPosition += lineHeight * 2;

//     pdf.setFontSize(18);
//     pdf.text('OF COMPLETION', pageWidth / 2, yPosition, {
//       align: 'center'
//     });

//     yPosition += lineHeight * 3;

//     // Body
//     pdf.setFontSize(14);
//     pdf.setFont('helvetica', 'normal');

//     pdf.text(
//       'This certificate is proudly presented to',
//       pageWidth / 2,
//       yPosition,
//       { align: 'center' }
//     );

//     yPosition += lineHeight * 2;

//     // Student Name
//     pdf.setFontSize(28);
//     pdf.setFont('helvetica', 'bold');

//     pdf.text(
//       certificate.studentName || 'Student Name',
//       pageWidth / 2,
//       yPosition,
//       { align: 'center' }
//     );

//     yPosition += lineHeight * 3;

//     pdf.setFontSize(14);
//     pdf.setFont('helvetica', 'normal');

//     pdf.text(
//       'for successfully completing the course',
//       pageWidth / 2,
//       yPosition,
//       { align: 'center' }
//     );

//     yPosition += lineHeight * 2;

//     // Course
//     pdf.setFontSize(22);
//     pdf.setFont('helvetica', 'bold');

//     pdf.text(
//       certificate.courseName || 'Course Name',
//       pageWidth / 2,
//       yPosition,
//       { align: 'center' }
//     );

//     yPosition += lineHeight * 3;

//     // Grade
//     pdf.setFontSize(16);
//     pdf.setFont('helvetica', 'bold');

//     pdf.text(
//       `Grade Awarded: ${certificate.gradeAwarded || 'A+'}`,
//       pageWidth / 2,
//       yPosition,
//       { align: 'center' }
//     );

//     yPosition += lineHeight * 2;

//     // Remarks
//     pdf.setFontSize(13);
//     pdf.setFont('helvetica', 'italic');

//     pdf.text(
//       `"${certificate.remarks || 'Excellent Performance'}"`,
//       pageWidth / 2,
//       yPosition,
//       { align: 'center', maxWidth: textWidth }
//     );

//     // Footer
//     pdf.setFontSize(10);
//     pdf.setFont('helvetica', 'normal');

//     pdf.text(
//       `Issued Date: ${
//         certificate.issueDate || new Date().toLocaleDateString()
//       }`,
//       margin,
//       pageHeight - 15
//     );

//     pdf.text(
//       `Certificate ID: ${
//         certificate.certificateId || 'N/A'
//       }`,
//       margin,
//       pageHeight - 8
//     );

//     // Save PDF
//     const filename = `Certificate_${
//       certificate.studentName?.replace(/\s+/g, '_') || 'Student'
//     }.pdf`;

//     pdf.save(filename);

//   } catch (error) {
//     console.error('Error creating PDF:', error);
//     alert('Error creating PDF. Please try again.');
//   }
// };

// /**
//  * Print certificate (browser's print dialog)
//  */
// export const printCertificate = (certificateRef) => {
//   try {
//     const printWindow = window.open('', '_blank');
//     if (!certificateRef?.innerHTML) {
//       alert('Certificate not found for printing');
//       return;
//     }

//     printWindow.document.write(`
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <title>Certificate</title>
//           <style>
//             body {
//               margin: 0;
//               padding: 0;
//               background: white;
//             }
//             @media print {
//               body { margin: 0; }
//             }
//           </style>
//         </head>
//         <body>
//           ${certificateRef.innerHTML}
//           <script>
//             window.print();
//             window.close();
//           </script>
//         </body>
//       </html>
//     `);
//     printWindow.document.close();
//   } catch (error) {
//     console.error('Error printing certificate:', error);
//     alert('Error printing certificate. Please try again.');
//   }
// };

// export default {
//   downloadCertificateAsPDF,
//   generateCertificatePDFSimple,
//   printCertificate,
// };



/**
 * Certificate PDF Download Utility
 * Install:
 * npm install html2canvas jspdf
 */

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Download full certificate UI as PDF
 */
export const downloadCertificateAsPDF = async (
  certificateRef,
  studentName,
  certificateId
) => {
  let clone = null;
  try {
    const btn = document.activeElement;

    if (btn) btn.disabled = true;

    // Clone the element and clean its zoom/transform styling so html2canvas renders it at normal scale
    clone = certificateRef.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.zIndex = '-9999';
    clone.style.transform = 'none';
    clone.style.zoom = '1';
    clone.style.width = '1200px'; // Natural landscape width
    clone.style.height = '850px'; // Natural landscape height
    clone.style.visibility = 'visible';
    clone.style.opacity = '1';
    
    // Force child element styling to be exactly 1200x850
    const innerDiv = clone.querySelector('[style*="width:"]');
    if (innerDiv) {
      innerDiv.style.width = '1200px';
      innerDiv.style.height = '850px';
      innerDiv.style.zoom = '1';
      innerDiv.style.transform = 'none';
    }

    document.body.appendChild(clone);

    // Convert certificate HTML into canvas using the off-screen clone
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null, // preserve template gradient
      logging: false,
      windowWidth: 1200,
      windowHeight: 850,
      scrollX: 0,
      scrollY: 0,
    });

    const imgData = canvas.toDataURL("image/png");

    // Create PDF
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Fit image inside PDF
    let imgWidth = pageWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > pageHeight) {
      imgHeight = pageHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    // Add image
    pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);

    // Filename
    const safeStudentName = studentName.replace(/\s+/g, "_");

    const safeCertificateId = certificateId.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    );

    const filename = `Certificate_${safeStudentName}_${safeCertificateId}.pdf`;

    // Save
    pdf.save(filename);

    if (btn) btn.disabled = false;

    return filename;
  } catch (error) {
    console.error("PDF Generation Error:", error);

    alert("Error generating certificate PDF");

    const btn = document.activeElement;

    if (btn) btn.disabled = false;
  } finally {
    if (clone && clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  }
};

/**
 * Simple text-only certificate PDF
 */
export const generateCertificatePDFSimple = (certificate) => {
  try {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 20;

    let y = 30;

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(34);

    pdf.text("CERTIFICATE", pageWidth / 2, y, {
      align: "center",
    });

    y += 15;

    pdf.setFontSize(18);

    pdf.text("OF COMPLETION", pageWidth / 2, y, {
      align: "center",
    });

    y += 30;

    // Body
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(14);

    pdf.text(
      "This certificate is proudly presented to",
      pageWidth / 2,
      y,
      {
        align: "center",
      }
    );

    y += 20;

    // Student Name
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28);

    pdf.text(
      certificate.studentName || "Student Name",
      pageWidth / 2,
      y,
      {
        align: "center",
      }
    );

    y += 25;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(14);

    pdf.text(
      "for successfully completing the course",
      pageWidth / 2,
      y,
      {
        align: "center",
      }
    );

    y += 18;

    // Course
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);

    pdf.text(
      certificate.courseName || "Course Name",
      pageWidth / 2,
      y,
      {
        align: "center",
      }
    );

    y += 22;

    // Grade
    pdf.setFontSize(16);

    pdf.text(
      `Grade Awarded: ${certificate.gradeAwarded || "A+"}`,
      pageWidth / 2,
      y,
      {
        align: "center",
      }
    );

    y += 18;

    // Remarks
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(13);

    pdf.text(
      `"${certificate.remarks || "Excellent Performance"}"`,
      pageWidth / 2,
      y,
      {
        align: "center",
        maxWidth: pageWidth - 40,
      }
    );

    // Footer
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    pdf.text(
      `Issued Date: ${
        certificate.issueDate ||
        new Date().toLocaleDateString()
      }`,
      margin,
      pageHeight - 15
    );

    pdf.text(
      `Certificate ID: ${
        certificate.certificateId || "N/A"
      }`,
      margin,
      pageHeight - 8
    );

    // Save
    const filename = `Certificate_${
      certificate.studentName?.replace(/\s+/g, "_") ||
      "Student"
    }.pdf`;

    pdf.save(filename);
  } catch (error) {
    console.error("Simple PDF Error:", error);

    alert("Error creating PDF");
  }
};

/**
 * Print certificate
 */
export const printCertificate = (certificateRef) => {
  try {
    const printWindow = window.open("", "_blank");

    if (!certificateRef?.innerHTML) {
      alert("Certificate not found");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background: white;
            }

            @media print {
              body {
                margin: 0;
              }
            }
          </style>
        </head>

        <body>
          ${certificateRef.innerHTML}

          <script>
            window.print();
            window.close();
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  } catch (error) {
    console.error("Print Error:", error);

    alert("Error printing certificate");
  }
};

export default {
  downloadCertificateAsPDF,
  generateCertificatePDFSimple,
  printCertificate,
};
