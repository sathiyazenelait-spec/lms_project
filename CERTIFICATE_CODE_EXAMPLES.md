# Certificate Feature - Code Examples & Demo

This document provides practical code examples for using the certificate feature in different scenarios.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Advanced Customization](#advanced-customization)
3. [Integration Examples](#integration-examples)
4. [Common Patterns](#common-patterns)
5. [Error Handling](#error-handling)

---

## Basic Usage

### Example 1: Display Certificate Modal

```jsx
import { useState } from 'react';
import { CertificatePreviewModal } from './components/CertificatePreviewModal';

function MyCertificates() {
  const [showModal, setShowModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  const certificateData = {
    id: 1,
    certificateNumber: 'CERT-1715773200000-456',
    studentName: 'John Doe',
    courseTitle: 'React Fundamentals',
    grade: 'A+',
    remarks: 'Outstanding performance and dedication',
    issueDate: '2024-05-15',
    teacherName: 'Prof. Jane Smith'
  };

  const handleViewCertificate = () => {
    setSelectedCert(certificateData);
    setShowModal(true);
  };

  return (
    <div>
      <button onClick={handleViewCertificate}>
        📥 View Certificate
      </button>

      <CertificatePreviewModal
        open={showModal}
        onClose={() => setShowModal(false)}
        certificate={selectedCert}
        studentName={certificateData.studentName}
      />
    </div>
  );
}

export default MyCertificates;
```

### Example 2: Just Download PDF (No Modal)

```jsx
import { useRef } from 'react';
import CertificateTemplate from './components/CertificateTemplate';
import { downloadCertificateAsPDF } from './utils/certificateUtils';

function SimpleDownload() {
  const certificateRef = useRef(null);

  const handleDownload = async () => {
    await downloadCertificateAsPDF(
      certificateRef.current,
      'John Doe',
      'CERT-2024-001'
    );
  };

  return (
    <div>
      <CertificateTemplate
        ref={certificateRef}
        studentName="John Doe"
        courseName="React Fundamentals"
        gradeAwarded="A+"
        remarks="Excellent work"
        certificateId="CERT-2024-001"
        issueDate="15 May 2024"
        instructorName="Prof. Jane Smith"
      />
      <button onClick={handleDownload}>
        Download PDF
      </button>
    </div>
  );
}

export default SimpleDownload;
```

---

## Advanced Customization

### Example 3: Custom Styled Certificate Modal

```jsx
import { useState, useRef } from 'react';
import CertificateTemplate from './components/CertificateTemplate';
import { downloadCertificateAsPDF } from './utils/certificateUtils';

function CustomCertificateModal({ certificate, onClose }) {
  const certificateRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCertificateAsPDF(
        certificateRef.current,
        certificate.studentName,
        certificate.certificateNumber
      );
      // Optional: Show success message
      alert('Certificate downloaded successfully!');
    } catch (error) {
      alert('Error downloading certificate. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        padding: '30px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      }}>
        <h2>{certificate.courseTitle} - Certificate</h2>
        
        <div style={{
          background: '#f5f5f5',
          padding: '20px',
          borderRadius: '8px',
          margin: '20px 0',
          overflow: 'auto',
          maxHeight: '400px',
        }}>
          <CertificateTemplate
            ref={certificateRef}
            studentName={certificate.studentName}
            courseName={certificate.courseTitle}
            gradeAwarded={certificate.grade}
            remarks={certificate.remarks}
            certificateId={certificate.certificateNumber}
            issueDate={new Date(certificate.issueDate).toLocaleDateString('en-IN')}
            instructorName={certificate.teacherName}
          />
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end',
          marginTop: '20px',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#ccc',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              padding: '10px 20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: downloading ? 'not-allowed' : 'pointer',
              opacity: downloading ? 0.7 : 1,
            }}
          >
            {downloading ? '⏳ Generating...' : '📥 Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomCertificateModal;
```

### Example 4: Certificate List with Download

```jsx
import { useState, useEffect } from 'react';
import { CertificatePreviewModal } from './components/CertificatePreviewModal';
import { getStudentCertificates } from './api/auth';

function CertificatesList() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const response = await getStudentCertificates();
      setCertificates(response.data || []);
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading certificates...</div>;
  }

  return (
    <div>
      <h2>My Certificates</h2>
      
      {certificates.length === 0 ? (
        <p>No certificates yet. Keep learning!</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #ddd' }}>Course</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #ddd' }}>Grade</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #ddd' }}>Issued Date</th>
              <th style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid #ddd' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {certificates.map((cert) => (
              <tr key={cert.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                  {cert.courseTitle}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                  <strong>{cert.grade}</strong>
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                  {new Date(cert.issueDate).toLocaleDateString()}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                  <button
                    onClick={() => {
                      setSelectedCert(cert);
                      setShowModal(true);
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    📥 View & Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <CertificatePreviewModal
        open={showModal}
        onClose={() => setShowModal(false)}
        certificate={selectedCert || {}}
        studentName={selectedCert?.studentName}
      />
    </div>
  );
}

export default CertificatesList;
```

---

## Integration Examples

### Example 5: Admin Dashboard - Issue Certificate

This would be in the Teacher/Admin interface:

```jsx
import { useState } from 'react';

function IssueCertificate() {
  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    grade: 'A',
    remarks: 'Outstanding Performance',
  });

  const handleIssueCertificate = async () => {
    try {
      const response = await fetch('/api/v1/teacher/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      alert(`Certificate issued! ID: ${result.data.certificateNumber}`);
    } catch (error) {
      alert('Error issuing certificate');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Issue Certificate</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label>Student:</label>
        <select
          value={formData.studentId}
          onChange={(e) => setFormData({
            ...formData,
            studentId: e.target.value
          })}
          style={{ width: '100%', padding: '8px' }}
        >
          <option value="">Select student...</option>
          {/* Options would be populated from API */}
        </select>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>Course:</label>
        <select
          value={formData.courseId}
          onChange={(e) => setFormData({
            ...formData,
            courseId: e.target.value
          })}
          style={{ width: '100%', padding: '8px' }}
        >
          <option value="">Select course...</option>
          {/* Options would be populated from API */}
        </select>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>Grade:</label>
        <select
          value={formData.grade}
          onChange={(e) => setFormData({
            ...formData,
            grade: e.target.value
          })}
          style={{ width: '100%', padding: '8px' }}
        >
          <option value="A+">A+</option>
          <option value="A">A</option>
          <option value="B+">B+</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>Remarks:</label>
        <textarea
          value={formData.remarks}
          onChange={(e) => setFormData({
            ...formData,
            remarks: e.target.value
          })}
          style={{ width: '100%', padding: '8px', minHeight: '100px' }}
          placeholder="e.g., Outstanding performance and dedication"
        />
      </div>

      <button
        onClick={handleIssueCertificate}
        style={{
          padding: '10px 20px',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Issue Certificate
      </button>
    </div>
  );
}

export default IssueCertificate;
```

---

## Common Patterns

### Example 6: Batch Download Multiple Certificates

```javascript
import { downloadCertificateAsPDF } from './utils/certificateUtils';

async function downloadMultipleCertificates(certificates) {
  for (const cert of certificates) {
    const ref = document.getElementById(`cert-${cert.id}`);
    
    if (ref) {
      await downloadCertificateAsPDF(
        ref,
        cert.studentName,
        cert.certificateNumber
      );
      
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Usage:
// downloadMultipleCertificates(certificatesList);
```

### Example 7: Share Certificate Link

```jsx
function ShareCertificate({ certificateId }) {
  const shareUrl = `${window.location.origin}/certificates/${certificateId}`;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  };

  return (
    <div>
      <input
        type="text"
        value={shareUrl}
        readOnly
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '10px',
        }}
      />
      <button onClick={handleCopyToClipboard}>
        📋 Copy Link
      </button>
    </div>
  );
}

export default ShareCertificate;
```

### Example 8: Certificate Verification

```jsx
async function verifyCertificate(certificateId) {
  try {
    const response = await fetch(
      `/api/v1/certificates/${certificateId}/verify`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    const data = await response.json();
    
    if (data.verified) {
      alert(`✓ Certificate is valid
        Issued to: ${data.studentName}
        Course: ${data.courseTitle}
        Date: ${data.issueDate}
      `);
    } else {
      alert('⚠ Certificate could not be verified');
    }
  } catch (error) {
    alert('Error verifying certificate');
  }
}
```

---

## Error Handling

### Example 9: Robust Error Handling

```jsx
import { useState } from 'react';
import { downloadCertificateAsPDF } from './utils/certificateUtils';

function SafeCertificateDownload({ certificate }) {
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setError(null);
    setDownloading(true);

    try {
      // Validate certificate data
      if (!certificate.studentName || !certificate.certificateNumber) {
        throw new Error('Invalid certificate data');
      }

      const certificateRef = document.getElementById('certificate');
      if (!certificateRef) {
        throw new Error('Certificate element not found');
      }

      // Attempt download
      await downloadCertificateAsPDF(
        certificateRef,
        certificate.studentName,
        certificate.certificateNumber
      );

    } catch (err) {
      // Handle specific errors
      if (err.message.includes('html2canvas')) {
        setError('PDF library not installed. Contact support.');
      } else if (err.message.includes('not found')) {
        setError('Certificate not ready. Please try again.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      {error && (
        <div style={{
          background: '#ffebee',
          color: '#c62828',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px',
        }}>
          ⚠️ {error}
        </div>
      )}

      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{
          opacity: downloading ? 0.7 : 1,
          cursor: downloading ? 'not-allowed' : 'pointer',
        }}
      >
        {downloading ? '⏳ Downloading...' : '📥 Download PDF'}
      </button>
    </div>
  );
}

export default SafeCertificateDownload;
```

### Example 10: API Error Handling

```jsx
async function fetchCertificatesWithErrorHandling() {
  try {
    const response = await fetch('/api/v1/student/certificates', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized. Please log in again.');
      } else if (response.status === 404) {
        throw new Error('Certificates not found.');
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(`HTTP Error: ${response.status}`);
      }
    }

    const data = await response.json();
    return data.data || [];

  } catch (error) {
    console.error('Error fetching certificates:', error);
    throw error;
  }
}
```

---

## Tips & Best Practices

1. **Always use refs for certificate elements** - Required for PDF generation
2. **Handle loading states** - Show spinners during PDF generation
3. **Validate certificate data** - Check all required fields exist
4. **Provide error messages** - Help users understand what went wrong
5. **Test with real data** - Use actual certificates from your system
6. **Check browser console** - Debug JavaScript errors
7. **Optimize for performance** - Cache certificate data when possible
8. **Secure API endpoints** - Always validate tokens and authorization

---

**Need more examples?** Check the component source code or documentation files.
