import React from "react";
import { Schema_Event } from "@core/types/event.types";
import { AlignItems, JustifyContent } from "@web/components/Flex/styled";
import { FlexDirections } from "@web/components/Flex/styled";
import { Flex } from "@web/components/Flex";
import { Text } from "@web/components/Text";

import { StyledMigrateArrow } from "./styled";

interface Props {
  event: Schema_Event;
  onMigrate: (event: Schema_Event, location: "forward" | "back") => void;
}

export const SomedayEventRow = ({ event, onMigrate }: Props) => {
  return (
    <Flex
      alignItems={AlignItems.FLEX_START}
      direction={FlexDirections.ROW}
      justifyContent={JustifyContent.SPACE_BETWEEN}
    >
      <Text size={15}>{event.title}</Text>
      <StyledMigrateArrow
        onClick={(e) => {
          e.stopPropagation();
          onMigrate(event, "forward");
        }}
        title="Migrate to next week"
        role="button"
      >
        {">"}
      </StyledMigrateArrow>
    </Flex>
  );
};