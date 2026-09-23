import SourceLibrary from "./SourceLibrary.jsx";

export default function FileList(props) {
  const filesState = {
    files: props.files || [],
    loading: props.loading,
    uploading: false,
    uploadProgress: 0,
    refreshFiles: props.onRefresh,
    deleteFile: props.onDelete,
  };

  return (
    <SourceLibrary
      filesState={filesState}
      selectedFile={props.selectedFile}
      onSelectFile={props.onSelect}
    />
  );
}
