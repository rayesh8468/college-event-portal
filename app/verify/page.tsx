import { Suspense } from "react";
import { CertificateVerifyContent } from "./VerifyContent";

export default function CertificateVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
            <p className="mt-3 text-sm text-muted-foreground">Verifying...</p>
          </div>
        </div>
      }
    >
      <CertificateVerifyContent />
    </Suspense>
  );
}
