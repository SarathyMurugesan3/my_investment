
import PdfUploader from "../../components/upload/PdfUploader";

const AdminUploadPdfPage = () => {
    return (
        <>
            <div className="space-y-6 animate-fade-in w-full max-w-7xl mx-auto">
                <div className="glass-panel p-6 rounded-2xl">
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Upload PDF</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Upload a PDF document to make it available to students via the secure viewer.
                    </p>
                </div>

                <div className="flex items-start gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-5 py-4 max-w-xl">
                    <svg className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-indigo-300">
                        Uploaded PDFs are served via the secure canvas-based viewer.
                        Right-click, copy, and print are disabled for all students.
                    </p>
                </div>

                <PdfUploader />
            </div>
        </>
    );
};

export default AdminUploadPdfPage;
