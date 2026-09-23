import PdfViewer from "./PdfViewer.jsx";
import TextViewer from "./TextViewer.jsx";
import UnsupportedDocument from "./UnsupportedDocument.jsx";
import { DOCUMENT_KINDS, getDocumentKind } from "../../utils/documentModel.js";

export default function DocumentContent({ file, citation, zoom = 100, fitWidth = false, search = null }) {
  const fileName = citation?.fileName || file?.file_name || "";
  const kind = citation?.kind || getDocumentKind(fileName);

  if (kind === DOCUMENT_KINDS.PDF) {
    return <PdfViewer file={file} citation={citation} zoom={zoom} fitWidth={fitWidth} search={search} />;
  }

  if (kind === DOCUMENT_KINDS.TXT) {
    return <TextViewer file={file} citation={citation} zoom={zoom} fitWidth={fitWidth} search={search} />;
  }

  return <UnsupportedDocument file={file} citation={citation} zoom={zoom} search={search} />;
}