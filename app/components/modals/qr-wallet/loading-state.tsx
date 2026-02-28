import { useRive } from '@rive-app/react-canvas';

type LoadingProps = {
  RiveComponent: ReturnType<typeof useRive>['RiveComponent'];
};

export const LoadingState = ({ RiveComponent }: LoadingProps) => (
  <div className="flex flex-col gap-2 items-center">
    <div className="w-24 h-24 self-center -mb-2 -mt-2">
      <RiveComponent style={{ width: '100%', height: '100%' }} />
    </div>
    <p className="text-sm text-muted-foreground text-center">
      Approve QR code with wallet...
    </p>
  </div>
);
