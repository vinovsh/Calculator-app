import Decimal from 'decimal.js';
type Category = {
  name: string;
  units: Record<string, number>;
  temperature?: boolean;
};
export const categories: Category[] = [
  {
    name: 'Length',
    units: {
      Metres: 1,
      Kilometres: 1000,
      Centimetres: 0.01,
      Millimetres: 0.001,
      Inches: 0.0254,
      Feet: 0.3048,
      Yards: 0.9144,
      Miles: 1609.344,
      'Nautical miles': 1852,
    },
  },
  {
    name: 'Area',
    units: {
      'Square metres': 1,
      'Square kilometres': 1e6,
      'Square feet': 0.09290304,
      'Square yards': 0.83612736,
      Acres: 4046.8564224,
      Hectares: 10000,
    },
  },
  {
    name: 'Volume',
    units: {
      Litres: 1,
      Millilitres: 0.001,
      'Cubic metres': 1000,
      'US gallons': 3.785411784,
      'Imperial gallons': 4.54609,
      'US fluid ounces': 0.0295735295625,
      'US cups': 0.2365882365,
    },
  },
  {
    name: 'Weight',
    units: {
      Kilograms: 1,
      Grams: 0.001,
      Milligrams: 0.000001,
      Tonnes: 1000,
      Pounds: 0.45359237,
      Ounces: 0.028349523125,
    },
  },
  {
    name: 'Temperature',
    temperature: true,
    units: { Celsius: 1, Fahrenheit: 1, Kelvin: 1 },
  },
  {
    name: 'Speed',
    units: {
      'Metres/second': 1,
      'Kilometres/hour': 1 / 3.6,
      'Miles/hour': 0.44704,
      Knots: 0.5144444444444444,
    },
  },
  {
    name: 'Time',
    units: {
      Seconds: 1,
      Milliseconds: 0.001,
      Minutes: 60,
      Hours: 3600,
      Days: 86400,
      Weeks: 604800,
    },
  },
  {
    name: 'Pressure',
    units: {
      Pascals: 1,
      Kilopascals: 1000,
      Bar: 100000,
      Atmospheres: 101325,
      PSI: 6894.757293168,
    },
  },
  {
    name: 'Energy',
    units: {
      Joules: 1,
      Kilojoules: 1000,
      Calories: 4.184,
      Kilocalories: 4184,
      'Watt-hours': 3600,
      'Kilowatt-hours': 3600000,
    },
  },
  {
    name: 'Data',
    units: {
      Bytes: 1,
      Bits: 0.125,
      'KB (1000)': 1000,
      'MB (1000²)': 1e6,
      'GB (1000³)': 1e9,
      'KiB (1024)': 1024,
      'MiB (1024²)': 1048576,
      'GiB (1024³)': 1073741824,
    },
  },
  {
    name: 'Power',
    units: {
      Watts: 1,
      Kilowatts: 1000,
      Megawatts: 1e6,
      'Mechanical horsepower': 745.6998715822702,
    },
  },
  {
    name: 'Angle',
    units: { Degrees: 1, Radians: 180 / Math.PI, Gradians: 0.9, Turns: 360 },
  },
];
export function convertUnit(
  value: string,
  category: Category,
  from: string,
  to: string,
): string {
  const v = new Decimal(value);
  if (!v.isFinite() || !category.units[from] || !category.units[to])
    throw Error('Enter a valid value');
  if (category.temperature) {
    const c =
      from === 'Fahrenheit'
        ? v.minus(32).mul(5).div(9)
        : from === 'Kelvin'
        ? v.minus('273.15')
        : v;
    if (c.lt('-273.15')) throw Error('Temperature is below absolute zero');
    return (
      to === 'Fahrenheit'
        ? c.mul(9).div(5).plus(32)
        : to === 'Kelvin'
        ? c.plus('273.15')
        : c
    )
      .toSignificantDigits(20)
      .toString();
  }
  if (v.lt(0) && !['Angle'].includes(category.name))
    throw Error('Enter a non-negative value');
  return v
    .mul(category.units[from])
    .div(category.units[to])
    .toSignificantDigits(20)
    .toString();
}
