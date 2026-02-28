import { Iconify } from '@/components/ui/iconify';

export const Error = ({ error }: { error: string | null }) => {
  return (
    <div>
      {error && (
        <div className="px-2 py-1.5 bg-red-500/10 flex rounded-md items-center gap-2">
          <Iconify
            icon="mingcute:alert-octagon-line"
            width={20}
            height={20}
            className="text-red-400"
          />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
};
