import styled from "styled-components";
import { ZIndex } from "@web/common/constants/web.constants";
import { ColorNames } from "@core/constants/colors";
import { getColor } from "@core/util/color.utils";
import { linearGradient } from "@core/constants/colors";

interface StyledNowLineProps {
  width: number;
  top: number;
}

export const StyledNowLine = styled.div<StyledNowLineProps>`
  /* the old, solid now line approach: 
  border-color: ${() => getColor(ColorNames.TEAL_2)}; 
  border-style: solid; 
  border-width: 2px 0 0; 
  */
  background: ${linearGradient};
  height: 1px;
  position: absolute;
  top: ${({ top }) => top}%;
  width: ${({ width }) => width}%;
  z-index: ${ZIndex.LAYER_2};
`;
