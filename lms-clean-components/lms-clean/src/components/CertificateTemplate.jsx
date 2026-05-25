import React from 'react';

const THEME = {
  primary: '#1e3c72',
  accent: '#d4af37',
  accentLight: '#f4d47f',
  darkBg: '#0f1419',
  lightText: '#ffffff',
  mutedText: '#b0b0b0',
};

export const CertificateTemplate = React.forwardRef(({ 
  studentName = 'Student Name',
  courseName = 'Course Name',
  gradeAwarded = 'A',
  remarks = 'Outstanding Performance',
  certificateId = 'CERT-2024-001',
  issueDate = new Date().toLocaleDateString('en-IN'),
  instructorName = 'Instructor Name'
}, ref) => {
  return (
    <div ref={ref} style={{
      width: '1200px',
      height: '850px',
      background: `linear-gradient(135deg, ${THEME.primary} 0%, #0a1f3b 100%)`,
      padding: '50px 60px',
      boxSizing: 'border-box',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      margin: 0,
    }}>
      {/* Decorative Background Elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.05,
        background: `radial-gradient(circle at 20% 50%, ${THEME.accent} 0%, transparent 50%),
                     radial-gradient(circle at 80% 80%, ${THEME.accent} 0%, transparent 50%)`,
        pointerEvents: 'none',
      }} />

      {/* Top Decorative Border */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '8px',
        background: `linear-gradient(90deg, transparent, ${THEME.accent}, transparent)`,
      }} />

      {/* Corner Ornaments */}
      {[
        { top: '20px', left: '20px', rotation: 0 },
        { top: '20px', right: '20px', rotation: 90 },
        { bottom: '20px', right: '20px', rotation: 180 },
        { bottom: '20px', left: '20px', rotation: 270 },
      ].map((pos, idx) => (
        <div key={idx} style={{
          position: 'absolute',
          ...pos,
          width: '40px',
          height: '40px',
          border: `2px solid ${THEME.accent}`,
          borderLeft: 'none',
          borderTop: 'none',
          opacity: 0.6,
          transform: `rotate(${pos.rotation}deg)`,
        }} />
      ))}

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%' }}>
        {/* Academy Logo/Badge */}
        <div style={{
          width: '70px',
          height: '70px',
          margin: '0 auto 15px',
          background: `linear-gradient(135deg, ${THEME.accent} 0%, ${THEME.accentLight} 100%)`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          fontWeight: 'bold',
          color: THEME.primary,
          boxShadow: `0 8px 16px rgba(${parseInt(THEME.accent.slice(1,3), 16)}, ${parseInt(THEME.accent.slice(3,5), 16)}, ${parseInt(THEME.accent.slice(5,7), 16)}, 0.3)`,
        }}>
          📜
        </div>

        {/* Certificate Title */}
        <h1 style={{
          fontSize: '52px',
          fontWeight: 'bold',
          color: THEME.accent,
          margin: '0 0 5px 0',
          textTransform: 'uppercase',
          fontFamily: 'Arial, sans-serif',
          textShadow: `0 2px 4px rgba(0, 0, 0, 0.5)`,
          lineHeight: '1.2',
          letterSpacing: '2px',
          wordSpacing: '10px',
        }}>
          Certificate
        </h1>
        
        <h2 style={{
          fontSize: '22px',
          fontWeight: '300',
          color: THEME.accentLight,
          margin: '0 0 15px 0',
          fontStyle: 'italic',
          lineHeight: '1.2',
          letterSpacing: '2px',
          wordSpacing: '10px',
        }}>
          of Completion
        </h2>

        {/* Divider Line */}
        <div style={{
          width: '280px',
          height: '3px',
          background: `linear-gradient(90deg, transparent, ${THEME.accent}, transparent)`,
          margin: '15px auto 20px',
        }} />

        {/* Recognition Text */}
        <p style={{
          fontSize: '15px',
          color: THEME.mutedText,
          margin: '0 0 20px 0',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'italic',
          lineHeight: '1.4',
          letterSpacing: '2px',
          wordSpacing: '10px',
        }}>
          This certificate is proudly presented to
        </p>

        {/* Student Name */}
        <h3 style={{
          fontSize: '40px',
          fontWeight: 'bold',
          color: THEME.lightText,
          margin: '0 auto 20px auto',
          maxWidth: '800px',
          borderBottom: `3px solid ${THEME.accent}`,
          paddingBottom: '12px',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif',
          textShadow: `0 2px 4px rgba(0, 0, 0, 0.5)`,
          lineHeight: '1.3',
          letterSpacing: '2px',
          wordSpacing: '10px',
        }}>
          {studentName}
        </h3>

        {/* Achievement Text */}
        <p style={{
          fontSize: '14px',
          color: THEME.mutedText,
          margin: '0 0 10px 0',
          fontFamily: 'Arial, sans-serif',
          lineHeight: '1.4',
          letterSpacing: '2px',
          wordSpacing: '10px',
        }}>
          for successfully completing the course
        </p>

        {/* Course Name */}
        <h4 style={{
          fontSize: '26px',
          fontWeight: 'bold',
          color: THEME.accent,
          margin: '0 0 10px 0',
          fontFamily: 'Arial, sans-serif',
          textShadow: `0 1px 2px rgba(0, 0, 0, 0.5)`,
          lineHeight: '1.2',
          letterSpacing: '2px',
          wordSpacing: '10px',
        }}>
          {courseName}
        </h4>

        {/* Grade Badge */}
        <div style={{
          display: 'inline-block',
          background: THEME.accent,
          color: THEME.primary,
          padding: '6px 20px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 'bold',
          margin: '10px 0',
          boxShadow: `0 4px 12px rgba(${parseInt(THEME.accent.slice(1,3), 16)}, ${parseInt(THEME.accent.slice(3,5), 16)}, ${parseInt(THEME.accent.slice(5,7), 16)}, 0.4)`,
          letterSpacing: '2px',
          wordSpacing: '10px',
        }}>
          Grade Awarded: {gradeAwarded}
        </div>

        {/* Remarks */}
        <p style={{
          fontSize: '13px',
          color: THEME.accentLight,
          margin: '10px auto 0 auto',
          fontStyle: 'italic',
          maxWidth: '700px',
          fontFamily: 'Arial, sans-serif',
          lineHeight: '1.4',
          letterSpacing: '2px',
          wordSpacing: '10px',
        }}>
          "{remarks}"
        </p>
      </div>

      {/* Bottom Section - Signature & Details */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: '20px',
        borderTop: `1px solid ${THEME.accent}`,
      }}>
        {/* Instructor Signature */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            height: '40px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            marginBottom: '5px',
            borderTop: `2px solid ${THEME.accent}`,
          }}>
            <span style={{
              fontSize: '22px',
              color: THEME.accent,
              fontFamily: 'cursive',
              fontWeight: 'bold',
              lineHeight: '1',
            }}>
              ✓
            </span>
          </div>
          <p style={{
            fontSize: '11px',
            color: THEME.mutedText,
            margin: '5px 0 0 0',
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.2',
            letterSpacing: '2px',
            wordSpacing: '10px',
          }}>
            Instructor: {instructorName}
          </p>
        </div>

        {/* Date */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontSize: '12px',
            color: THEME.accent,
            marginBottom: '8px',
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.2',
            letterSpacing: '2px',
            wordSpacing: '10px',
          }}>
            Date of Issuance
          </div>
          <p style={{
            fontSize: '14px',
            color: THEME.lightText,
            margin: '0',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.2',
            letterSpacing: '2px',
            wordSpacing: '10px',
          }}>
            {issueDate}
          </p>
        </div>

        {/* Certificate ID */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontSize: '11px',
            color: THEME.mutedText,
            marginBottom: '8px',
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.2',
            letterSpacing: '2px',
            wordSpacing: '10px',
          }}>
            CERTIFICATE ID
          </div>
          <p style={{
            fontSize: '12px',
            color: THEME.accent,
            margin: '0',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            lineHeight: '1.2',
            letterSpacing: '2px',
            wordSpacing: '10px',
          }}>
            {certificateId}
          </p>
        </div>
      </div>

      {/* Bottom Decorative Border */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '8px',
        background: `linear-gradient(90deg, transparent, ${THEME.accent}, transparent)`,
      }} />

      {/* Watermark */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        right: '30px',
        fontSize: '48px',
        opacity: 0.08,
        pointerEvents: 'none',
        fontWeight: 'bold',
        color: THEME.accent,
      }}>
        ★
      </div>
    </div>
  );
});

CertificateTemplate.displayName = 'CertificateTemplate';

export default CertificateTemplate;
