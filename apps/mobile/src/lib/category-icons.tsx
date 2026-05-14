import React from 'react';
import IconScissors from '@tabler/icons-react-native/dist/esm/icons/IconScissors.mjs';
import IconSparkles from '@tabler/icons-react-native/dist/esm/icons/IconSparkles.mjs';
import IconEye from '@tabler/icons-react-native/dist/esm/icons/IconEye.mjs';
import IconLeaf from '@tabler/icons-react-native/dist/esm/icons/IconLeaf.mjs';
import IconDroplet from '@tabler/icons-react-native/dist/esm/icons/IconDroplet.mjs';
import { colors } from '../theme/colors';

type IconComponent = React.ComponentType<{ size: number; color: string }>;

const BY_EMOJI: Record<string, IconComponent> = {
  '💇': IconScissors,
  '💅': IconSparkles,
  '💄': IconEye,
  '💆': IconLeaf,
  '✂️': IconScissors,
  '🧖': IconDroplet,
};

const BY_NAME: Record<string, IconComponent> = {
  Coiffure: IconScissors,
  Ongles: IconSparkles,
  Maquillage: IconEye,
  Soins: IconLeaf,
  Barber: IconScissors,
  Spa: IconDroplet,
};

export function CategoryIcon({
  icon,
  name,
  size = 20,
  color = colors.primary,
}: {
  icon?: string;
  name?: string;
  size?: number;
  color?: string;
}) {
  const Icon =
    (icon ? BY_EMOJI[icon] : undefined) ??
    (name ? BY_NAME[name] : undefined) ??
    IconScissors;
  return <Icon size={size} color={color} />;
}
