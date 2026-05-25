import React, { useRef } from 'react';
import CertificateTemplate from './CertificateTemplate';
import { downloadCertificateAsPDF, printCertificate } from '../utils/certificateUtils';

const THEME = {
  primary: '#1e3c72',
  accent: '#d4af37',
  accentLight: '#f4d47f',
  darkBg: '#0f1419',
  lightText: '#ffffff',
  mutedText: '#b0b0b0',
  bg: '#f8f9fa',
  bg2: '#e0e0e0',
  bg3: '#f0f0f0',
  primaryL: '#3d7dd4',
};

export const CertificatePreviewModal = ({
  open = false,
  onClose = () => {},
  certificate = {},
  studentName = '',
}) => {
  const certificateRef = useRef(null);
  const [downloading, setDownloading] = React.useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await downloadCertificateAsPDF(
        certificateRef.current,
        studentName || certificate.studentName,
        certificate.certificateNumber
      );
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    printCertificate(certificateRef.current);
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(4px)',
      padding: '20px',
    }}>
      <div style={{
        background: THEME.bg,
        borderRadius: '16px',
        maxWidth: '1100px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        animation: 'slideUp 0.3s ease-out',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px',
          borderBottom: `1px solid ${THEME.bg2}`,
          background: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.darkBg} 100%)`,
        }}>
          <h2 style={{
            margin: 0,
            color: THEME.accent,
            fontSize: '20px',
            fontWeight: 'bold',
            fontFamily: '"Syne", sans-serif',
          }}>
            🎖️ View Certificate
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: THEME.lightText,
              fontSize: '28px',
              cursor: 'pointer',
              padding: '0',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s ease',
              opacity: 0.7,
              ':hover': {
                opacity: 1,
                background: 'rgba(255, 255, 255, 0.1)',
              },
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '1';
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '0.7';
              e.target.style.background = 'none';
            }}
          >
            ✕
          </button>
        </div>

        {/* Certificate Preview */}
        {/* <div style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px',
          background: THEME.bg3,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            transform: 'scale(0.5)',
            transformOrigin: 'center',
            width: '1000px',
            height: '700px',
          }}>
            <div ref={certificateRef} style={{ width: '100%', height: '100%' }}>
              <CertificateTemplate
                studentName={studentName || certificate.studentName || 'Student Name'}
                courseName={certificate.courseTitle || 'Course Name'}
                gradeAwarded={certificate.grade || 'A'}
                remarks={certificate.remarks || 'Outstanding Performance'}
                certificateId={certificate.certificateNumber || 'CERT-2024-001'}
                issueDate={new Date(certificate.issueDate).toLocaleDateString('en-IN')}
                instructorName={certificate.teacherName || 'Instructor Name'}
              />
            </div>
          </div>
        </div> */}
        <div
  style={{
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '30px',
    background: THEME.bg3,
  }}
>
  <div
    style={{
      zoom: 0.5,
      transformOrigin: 'top center',
    }}
  >
    <div
      ref={certificateRef}
      id="certificate-download"
      style={{
        background: '#fff',
        overflow: 'hidden',
        borderRadius: '10px',
      }}
    >
      <CertificateTemplate
        studentName={
          studentName || certificate.studentName || 'Student Name'
        }
        courseName={certificate.courseTitle || 'Course Name'}
        gradeAwarded={certificate.grade || 'A'}
        remarks={
          certificate.remarks || 'Outstanding Performance'
        }
        certificateId={
          certificate.certificateNumber || 'CERT-2024-001'
        }
        issueDate={new Date(
          certificate.issueDate
        ).toLocaleDateString('en-IN')}
        instructorName={
          certificate.teacherName || 'Instructor Name'
        }
      />
    </div>
  </div>
</div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '24px',
          borderTop: `1px solid ${THEME.bg2}`,
          background: THEME.bg,
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={handlePrint}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '600',
              border: `1.5px solid ${THEME.primary}`,
              background: 'white',
              color: THEME.primary,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: '"Syne", sans-serif',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = THEME.primary;
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.color = THEME.primary;
            }}
          >
            🖨️ Print
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              background: downloading ? THEME.mutedText : THEME.accent,
              color: THEME.primary,
              borderRadius: '8px',
              cursor: downloading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: '"Syne", sans-serif',
              opacity: downloading ? 0.7 : 1,
              boxShadow: `0 4px 12px rgba(212, 175, 55, 0.3)`,
            }}
            onMouseEnter={(e) => {
              if (!downloading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = `0 6px 16px rgba(212, 175, 55, 0.4)`;
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = `0 4px 12px rgba(212, 175, 55, 0.3)`;
            }}
          >
            {downloading ? '⏳ Generating PDF...' : '📥 Download PDF'}
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              background: THEME.bg2,
              color: THEME.primary,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: '"Syne", sans-serif',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = THEME.mutedText;
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = THEME.bg2;
              e.target.style.color = THEME.primary;
            }}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CertificatePreviewModal;
