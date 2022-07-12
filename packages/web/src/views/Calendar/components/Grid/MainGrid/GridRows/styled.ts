import styled from "styled-components";
import { getColor } from "@web/common/utils/colors";
import { ColorNames } from "@web/common/types/styles";
import { Flex } from "@web/components/Flex";
import { GRID_MARGIN_LEFT } from "@web/views/Calendar/layout.constants";
import { DIVIDER_GRID } from "@web/views/Calendar/layout.constants";
import { GRID_LINE_OPACITY_PERCENT } from "@web/common/styles/colors";

export const gridDividerBorder = `${DIVIDER_GRID}px solid ${getColor(
  ColorNames.GREY_4
)}${GRID_LINE_OPACITY_PERCENT}`;

export const StyledGridRow = styled(Flex)`
  height: calc(100% / 11);
  border-bottom: ${gridDividerBorder};
  width: 100%;
  position: relative;

  & > span {
    position: absolute;
    bottom: -5px;
    left: -${GRID_MARGIN_LEFT}px;
  }
`;
export const StyledGridRows = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  left: 35px;
`;