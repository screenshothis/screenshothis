import Globe02Icon from "virtual:icons/hugeicons/globe-02";

import * as Select from './ui/select.tsx';

const languages = [
  {
    value: 'eng',
    label: 'ENG',
  },
  {
    value: 'spa',
    label: 'SPA',
  },
  {
    value: 'tur',
    label: 'TUR',
  },
  {
    value: 'deu',
    label: 'DEU',
  },
];

export function LanguageSelect({ ...props }) {
  return (
    <Select.Root defaultValue='eng' $variant='inline' {...props}>
      <Select.Trigger>
        <Select.TriggerIcon as={Globe02Icon} />
        <Select.Value placeholder='Select Language' />
      </Select.Trigger>
      <Select.Content>
        {languages.map((lang) => (
          <Select.Item key={lang.value} value={lang.value}>
            {lang.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}
