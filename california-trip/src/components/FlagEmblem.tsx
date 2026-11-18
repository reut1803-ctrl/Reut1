import WavingFlag from "./home/WavingFlag";
import { MOSHIACH_FLAG, US_FLAG } from "./home/flags";

// סמל קטן ומכובד: שני תורנים מוצלבים. דגל משיח בצד ימין (מקום הכבוד),
// ודגל אמריקה משמאל, מונף כשהכוכבים צמודים לתורן.
export default function FlagEmblem() {
  return (
    <div className="emblem" aria-label="דגל משיח ודגל ארצות הברית" role="img">
      <div className="mini-pole mini-pole--left">
        <span className="mini-cap" />
        <div className="mini-mount mini-mount--left">
          <WavingFlag art={US_FLAG} label="" phase={0.8} />
        </div>
      </div>
      <div className="mini-pole mini-pole--right">
        <span className="mini-cap" />
        <div className="mini-mount mini-mount--right">
          <WavingFlag art={MOSHIACH_FLAG} label="" />
        </div>
      </div>
    </div>
  );
}
