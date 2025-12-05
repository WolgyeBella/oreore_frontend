import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    color: {
      orange: string;
      orange30: string;
      orange70: string;
      blue: string;
      blue30: string;
      blue70: string;
      brown: string;
      ivory: string;
      lightGrey: string;
      grey: string;
      deepGrey: string;
      black: string;
      background: string;
      white: string;
    };
    font: {
      LogoFont: string;
      title: string;
      small: string;
    };
  }
}
