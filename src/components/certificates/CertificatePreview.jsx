/**
 * CertificatePreview (Official Career Radar Certificate Design)
 *
 * Delegates directly to CertificateAppreciationPreview so all certificate
 * previews across the entire app use the official client design.
 */

import CertificateAppreciationPreview from './CertificateAppreciationPreview'

export default function CertificatePreview(props) {
  return <CertificateAppreciationPreview {...props} />
}

export { CertificateAppreciationPreview }