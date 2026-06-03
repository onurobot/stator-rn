import { ConnectToolForm } from '@/components/tools/connect-tool-form';

export default function NewToolPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Connect a Tool</h1>
      <ConnectToolForm />
    </div>
  );
}
