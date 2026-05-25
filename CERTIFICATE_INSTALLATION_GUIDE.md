# Certificate Feature - Installation & Setup Guide

## Quick Start

### Prerequisites

- Node.js 14+ and npm installed
- React 18.2.0 environment
- Existing LMS backend running

### Installation Steps

#### 1. Install Dependencies

Navigate to the frontend directory:
```bash
cd lms-clean-components/lms-clean
```

Install the required packages:
```bash
npm install html2canvas jspdf
```

**Or**, if dependencies are already in `package.json`:
```bash
npm install
```

#### 2. Verify Component Files

Ensure the following files are in place:

✅ **Frontend Components:**
```
src/
├── components/
│   ├── CertificateTemplate.jsx          
│   └── CertificatePreviewModal.jsx      
├── utils/
│   └── certificateUtils.js              
└── pages/
    └── Student/
        └── index.jsx                    (Updated)
```

#### 3. Start the Development Server

```bash
npm start
```

The application should open at `http://localhost:3000`

#### 4. Verify Installation

1. Login as a student
2. Navigate to Dashboard → Certificates
3. If you have any certificates, click "📥 View & Download"
4. The certificate modal should appear with a preview
5. Test the "📥 Download PDF" button

## Troubleshooting Installation

### Problem: `npm install` fails

**Error:** `ERESOLVE unable to resolve dependency tree`

**Solution:**
```bash
npm install --legacy-peer-deps
```

Or use npm 7+:
```bash
npm install --save --save-exact html2canvas@1.4.1 jspdf@2.5.1
```

### Problem: Module not found errors

**Error:** `Cannot find module 'html2canvas'`

**Solution:**
1. Verify installation:
   ```bash
   npm list html2canvas jspdf
   ```

2. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Problem: Certificate modal doesn't appear

**Check:**
1. Browser console for JavaScript errors
2. That `CertificatePreviewModal` is properly imported
3. That you have at least one certificate in the system

**Solution:**
- Check browser DevTools → Console
- Verify import statement in Student/index.jsx
- Create a test certificate through the Teacher interface

## File Structure Overview

### CertificateTemplate.jsx
**Location:** `src/components/CertificateTemplate.jsx`

Pure React component that renders the certificate design.

**What it does:**
- Renders a beautiful certificate with all details
- Uses inline CSS for styling
- Ref-based for HTML capture

**Used by:** CertificatePreviewModal

### CertificatePreviewModal.jsx
**Location:** `src/components/CertificatePreviewModal.jsx`

Modal component for viewing and downloading certificates.

**What it does:**
- Shows certificate preview at 50% scale
- Provides download and print buttons
- Manages modal state
- Handles PDF generation

**Props:**
- `open`: Boolean
- `onClose`: Function
- `certificate`: Object
- `studentName`: String

### certificateUtils.js
**Location:** `src/utils/certificateUtils.js`

Utility functions for PDF operations.

**Exported functions:**
- `downloadCertificateAsPDF()` - Generate and download PDF
- `printCertificate()` - Print to browser print dialog
- `generateCertificatePDFSimple()` - Simpler PDF generation (no dependencies)

### Updated Student/index.jsx
**Location:** `src/pages/Student/index.jsx`

Changes made:
1. Added import for `CertificatePreviewModal`
2. Updated `StudentCertificates` component
3. Added modal state management
4. Added download button to certificate cards

## Configuration

### API Configuration

The certificate feature uses the existing student API:

**Endpoint:** `GET /api/v1/student/certificates`

Make sure your backend returns data in this format:
```json
{
  "data": [
    {
      "id": 1,
      "certificateNumber": "CERT-1715773200000-456",
      "courseTitle": "Course Name",
      "grade": "A",
      "remarks": "Outstanding Performance",
      "issueDate": "2024-05-15",
      "teacherName": "Teacher Name"
    }
  ]
}
```

### Backend Verification

Test the endpoint:
```bash
curl -X GET http://localhost:8080/api/v1/student/certificates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Development Setup

### For Frontend Development

1. **Hot Reload:** Changes to certificate components will auto-refresh
2. **Debugging:** Use React Developer Tools extension
3. **Console Logs:** Check browser console for debug info

### Adding a New Feature to Certificate

**Example:** Add completion date field

1. **Update Certificate API Response** (Backend):
   ```json
   {
     "completionDate": "2024-05-15"
   }
   ```

2. **Update CertificateTemplate Component**:
   ```jsx
   export const CertificateTemplate = React.forwardRef(({ 
     // ... existing props
     completionDate = '2024-05-15',
   }, ref) => {
     // ... render it in the template
   });
   ```

3. **Pass the prop from Modal**:
   ```jsx
   <CertificateTemplate
     // ... existing props
     completionDate={certificate.completionDate}
   />
   ```

## Environment Variables

No additional environment variables needed. The feature uses:
- Existing API base URL from `auth.js`
- Existing authentication tokens
- Browser APIs (Canvas, Print, Download)

## Performance Optimization

### PDF Generation Speed

Current: ~500ms-1s

**To optimize:**

1. **Reduce resolution:**
   ```javascript
   // In certificateUtils.js, line ~17
   scale: 1,  // Instead of 2
   ```

2. **Use simpler template:**
   - Current template has gradients and patterns
   - These add processing time
   - Consider a simpler design for faster generation

### Modal Performance

- Preview is scaled (50%) for better performance
- Modal uses CSS transforms
- No animations on certificate content

## Testing Checklist

Before deploying, verify:

- [ ] Dependencies installed: `npm list html2canvas jspdf`
- [ ] Components created in correct locations
- [ ] Student/index.jsx updated with import
- [ ] No console errors when viewing certificates
- [ ] Modal opens when clicking "View & Download"
- [ ] PDF downloads when clicking "Download PDF"
- [ ] PDF filename is correct format
- [ ] Print dialog opens when clicking "Print"
- [ ] Modal closes when clicking "Close" or X button
- [ ] Verify button shows certificate authenticity info

## Deployment

### Production Build

```bash
npm run build
```

This creates an optimized build in the `build/` directory.

### Deployment Checklist

- [ ] All dependencies included in package.json
- [ ] No development-only code in production
- [ ] Browser compatibility tested (Chrome, Firefox, Safari, Edge)
- [ ] PDF generation tested on target deployment machine
- [ ] Backend API endpoints verified
- [ ] CORS configured if needed
- [ ] SSL/TLS certificates valid for HTTPS

### Common Production Issues

**Issue:** PDF generation fails in production

**Solution:** Ensure `html2canvas` can access all resources (images, fonts)
```javascript
const canvas = await html2canvas(certificateRef, {
  allowTaint: true,      // Allow tainted canvas
  useCORS: true,         // Use CORS for images
  // ... other options
});
```

**Issue:** Large file sizes

**Solution:** Compress PDFs after generation
- Use a library like `pdfkit` for more control
- Or use a backend PDF service

## Support & Documentation

### Internal Documentation

- See `CERTIFICATE_FEATURE_DOCUMENTATION.md` for detailed feature docs
- See component code comments for implementation details

### Getting Help

1. Check the documentation files
2. Review component source code
3. Check browser console for errors
4. Test with different browsers
5. Verify backend API responses

## Version Info

**Certificate Feature Version:** 1.0.0

**Dependencies:**
- `html2canvas`: ^1.4.1
- `jspdf`: ^2.5.1

**Tested with:**
- React: 18.2.0
- Node: 14-18 LTS
- npm: 6-8

## Next Steps

After installation:

1. **Customize Certificate Design**
   - Edit colors in `CertificateTemplate.jsx`
   - Add your academy logo
   - Adjust typography and layout

2. **Enhance Features**
   - Add watermarks
   - Include QR codes
   - Add digital signatures
   - Enable email distribution

3. **Monitor Usage**
   - Track downloads
   - Collect user feedback
   - Monitor performance
   - Optimize based on usage patterns

4. **Integrate with Other Systems**
   - LinkedIn integration
   - Certificate blockchain verification
   - Third-party verification systems

---

**Questions?** Check CERTIFICATE_FEATURE_DOCUMENTATION.md or review component source code.

**Ready to deploy?** Follow the Deployment checklist above.
