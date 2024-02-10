import Recorder from "./components/Recorder";

export default function Home() {
  return (
    <div className="flex w-full h-full flex-col items-center justify-between md:px-80 px-0">
      <Recorder />
    </div>
  );
}
