import { useRive } from '@rive-app/react-canvas';

export default function Loader() {
  const { RiveComponent } = useRive({
    src: '/assets/loader.riv',
    autoplay: true,
  });
  return (
    <div className="flex justify-center items-center w-full h-full">
      <RiveComponent style={{ width: 200, height: 200 }} />
    </div>
  );
}
