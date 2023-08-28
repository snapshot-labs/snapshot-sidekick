import type { State } from '../../../helpers/snapshot';

export default function (status: State) {
  const statusesColor: Record<State, string> = {
    pending: 'rgb(107, 114, 128)',
    active: 'rgb(33, 182, 111)',
    closed: 'rgb(187, 107, 217)'
  };

  return (
    <span
      style={{
        color: '#fff',
        fontSize: '36px',
        textTransform: 'capitalize',
        height: '52px',
        padding: '0 24px',
        borderRadius: '28px',
        lineHeight: '60px',
        background: statusesColor[status]
      }}
    >
      {status}
    </span>
  );
}
