import { useParams } from "react-router-dom";

import SecurePdfViewer from "../../components/pdf/SecurePdfViewer";

const PdfViewerPage = () => {
  const { id } = useParams();

  return (
    <>
      <SecurePdfViewer id={id} />
    </>
  );
};

export default PdfViewerPage;
