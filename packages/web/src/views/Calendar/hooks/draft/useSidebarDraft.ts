import { useState, useMemo, useCallback, useEffect } from "react";
import dayjs from "dayjs";
import { DropResult } from "@hello-pangea/dnd";
import {
  SOMEDAY_WEEKLY_LIMIT,
  SOMEDAY_WEEK_LIMIT_MSG,
} from "@core/constants/core.constants";
import { YEAR_MONTH_DAY_FORMAT } from "@core/constants/date.constants";
import { Categories_Event, Schema_Event } from "@core/types/event.types";
import { getWeekRangeDates } from "@core/util/date.utils";
import { Schema_GridEvent } from "@web/common/types/web.event.types";
import {
  getDefaultEvent,
  prepEvtBeforeSubmit,
} from "@web/common/utils/event.util";
import { getWeekRangeLabel } from "@web/common/utils/web.date.util";
import {
  selectDraftId,
  selectDraftStatus,
  selectSomedayEvents,
} from "@web/ducks/events/event.selectors";
import {
  draftSlice,
  editEventSlice,
  createEventSlice,
} from "@web/ducks/events/event.slice";
import { useAppDispatch, useAppSelector } from "@web/store/store.hooks";
import { Range_Week } from "@web/common/types/util.types";
import { Measurements_Grid } from "@web/views/Calendar/hooks/grid/useGridLayout";
import {
  COLUMN_WEEK,
  ID_SOMEDAY_DRAFT,
} from "@web/common/constants/web.constants";

import { useMousePosition } from "./useMousePosition";

export const useSomedayEvents = (
  measurements: Measurements_Grid,
  weekRange: Range_Week
) => {
  const dispatch = useAppDispatch();

  const _somedayEvents = useAppSelector(selectSomedayEvents);
  const [somedayEvents, setSomedayEvents] = useState(_somedayEvents);
  useEffect(() => {
    setSomedayEvents(_somedayEvents);
  }, [_somedayEvents]);

  const { isDrafting: isDraftingRedux } = useAppSelector(selectDraftId);
  const { eventType: draftType } = useAppSelector(selectDraftStatus);

  const [draft, setDraft] = useState<Schema_GridEvent | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isDraftingExisting, setIsDraftingExisting] = useState(false);

  // const isDragging = draft !== null; //++
  const isDragging = isDrafting && isDraftingRedux && draft !== null;

  const { isOverGrid, mouseCoords } = useMousePosition(
    isDragging,
    draft?.isOpen,
    measurements
  );

  const weekLabel = useMemo(
    () => getWeekRangeLabel(weekRange.weekStart, weekRange.weekEnd),
    [weekRange]
  );

  const existingIds = somedayEvents.columns[COLUMN_WEEK].eventIds;

  const _isAtLimit = useCallback(() => {
    return existingIds.length >= SOMEDAY_WEEKLY_LIMIT;
  }, [existingIds]);

  const createDefaultSomeday = useCallback(() => {
    const somedayDefault = getDefaultEvent(Categories_Event.SOMEDAY);

    setDraft({
      ...somedayDefault,
      endDate: weekRange.weekEnd.format(YEAR_MONTH_DAY_FORMAT),
      startDate: weekRange.weekStart.format(YEAR_MONTH_DAY_FORMAT),
      isOpen: true,
    });

    setIsDrafting(true);
  }, [weekRange.weekEnd, weekRange.weekStart]);

  useEffect(() => {
    setIsDraftingExisting(existingIds.includes(draft?._id));
  }, [existingIds, draft]);

  useEffect(() => {
    if (!isDraftingRedux || draftType !== Categories_Event.SOMEDAY) {
      setIsDrafting(false);
      setDraft(null);
    }
  }, [draftType, isDraftingRedux]);

  useEffect(() => {
    if (isDraftingExisting) {
      dispatch(
        draftSlice.actions.start({
          eventType: Categories_Event.SOMEDAY,
        })
      );
    }
  }, [dispatch, isDraftingExisting]);

  const handleSomedayTrigger = useCallback(() => {
    if (
      isDraftingRedux &&
      draftType === Categories_Event.SOMEDAY &&
      !isDraftingExisting
    ) {
      if (_isAtLimit()) {
        alert(SOMEDAY_WEEK_LIMIT_MSG);
        return;
      }
      console.log("creating default someday..."); //++
      createDefaultSomeday();
    }
  }, [
    createDefaultSomeday,
    draftType,
    isDraftingExisting,
    isDraftingRedux,
    _isAtLimit,
  ]);

  useEffect(() => {
    handleSomedayTrigger();
  }, [handleSomedayTrigger]);

  const close = () => {
    setIsDrafting(false);
    setDraft(null);

    if (isDraftingRedux && draftType === Categories_Event.SOMEDAY) {
      dispatch(draftSlice.actions.discard());
    }
  };

  const onDraft = (event: Schema_Event) => {
    // const newState = {
    //   ...somedayEvents,
    //   events: {
    //     ...somedayEvents.events,
    //     [event._id]: { ...event, isOpen: true },
    //   },
    // };
    // setSomedayEvents(newState);
    // console.log(newState.events[event._id]);

    console.log("onDraft");
    setIsDrafting(true);
    setDraft({
      ...event,
      isOpen: true,
      // startDate: weekRange.weekStart.format(YEAR_MONTH_DAY_FORMAT),
      // endDate: weekRange.weekEnd.format(YEAR_MONTH_DAY_FORMAT),
    });
  };

  const onDragEnd = (result: DropResult) => {
    const reorderedDraft = result.draggableId === ID_SOMEDAY_DRAFT;
    if (reorderedDraft && !isDraftingExisting) {
      console.log("TODO: add draft to state");
      return;
    }

    const { destination, source } = result;

    if (!destination) {
      close();
      return;
    }

    const noChange =
      destination.droppableId === source.droppableId &&
      destination.index === source.index;

    noChange && console.log("no change, closing");
    if (noChange) {
      close();
      return;
    }

    reorder(result);
    console.log("closing after reorder");
    close();
  };

  const onDragStart = (props: { draggableId: string }) => {
    console.log("starting drag...");
    const existingEvent = somedayEvents.events[props.draggableId];
    const isExisting = existingEvent !== undefined;

    let _draft: Schema_GridEvent;
    if (isExisting) {
      _draft = {
        ...existingEvent,
        isOpen: false,
      };
    } else {
      const defaultSomeday = getDefaultEvent(Categories_Event.SOMEDAY);
      _draft = { ...defaultSomeday, isOpen: false };
    }

    setDraft(_draft);
    setIsDrafting(true);
  };

  const onMigrate = (event: Schema_Event, location: "forward" | "back") => {
    const diff = location === "forward" ? 7 : -7;

    const startDate = dayjs(event.startDate)
      .add(diff, "days")
      .format(YEAR_MONTH_DAY_FORMAT);

    const endDate = dayjs(event.endDate)
      .add(diff, "days")
      .format(YEAR_MONTH_DAY_FORMAT);

    const _event = { ...event, startDate, endDate };

    const isExisting = _event._id;
    if (isExisting) {
      dispatch(
        editEventSlice.actions.migrate({
          _id: _event._id,
          event: _event,
        })
      );
    } else {
      dispatch(createEventSlice.actions.request(_event));
    }

    close();
  };

  const onSubmit = () => {
    const _event = prepEvtBeforeSubmit(draft);
    const { startDate, endDate } = getWeekRangeDates(
      weekRange.weekStart,
      weekRange.weekEnd
    );
    const event = { ..._event, startDate, endDate };

    const isExisting = event._id;
    if (isExisting) {
      dispatch(
        editEventSlice.actions.request({
          _id: event._id,
          event,
        })
      );
    } else {
      dispatch(createEventSlice.actions.request(event));
    }

    close();
  };

  const onSectionClick = () => {
    if (isDraftingRedux) {
      console.log("discarding after sect click");
      dispatch(draftSlice.actions.discard());
      return;
    }

    if (isDrafting) {
      console.log("closing after sect click");
      draft && close();
      return;
    }

    if (_isAtLimit()) {
      alert(SOMEDAY_WEEK_LIMIT_MSG);
      return;
    }

    console.log("creating new after sect click...");
    dispatch(
      draftSlice.actions.start({
        eventType: Categories_Event.SOMEDAY,
      })
    );

    createDefaultSomeday();
  };

  const reorder = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    const column = somedayEvents.columns[source.droppableId];
    const newEventIds = Array.from(column.eventIds);
    newEventIds.splice(source.index, 1);
    newEventIds.splice(destination.index, 0, draggableId);

    const newColumn = {
      ...column,
      eventIds: newEventIds,
    };

    const newState = {
      ...somedayEvents,
      columns: {
        ...somedayEvents.columns,
        [newColumn.id]: newColumn,
      },
    };

    setSomedayEvents(newState);
  };

  const somedayEventsProps = {
    state: {
      draft,
      somedayEvents,
      isDraftingExisting:
        isDrafting &&
        draft !== null &&
        isDraftingRedux &&
        draftType === Categories_Event.SOMEDAY,
      isDraftingNew:
        isDrafting && !isDraftingExisting && !existingIds.includes(draft?._id),
      isOverGrid,
      mouseCoords,
      weekLabel,
    },
    util: {
      close,
      onDraft,
      onDragEnd,
      onDragStart,
      onMigrate,
      onSectionClick,
      onSubmit,
      setDraft,
      setIsDrafting,
    },
  };

  return somedayEventsProps;
};

export type SomedayEventsProps = ReturnType<typeof useSomedayEvents>;

/*
  useEffect(() => {
    // setSomedayEvents(_somedayEvents.sort((a, b) => a.order - b.order));
    const somedayEventsWithSortableId = _somedayEvents.map((e) => ({
      ...e,
      id: e._id,
    }));
    setSomedayEvents(somedayEventsWithSortableId);
    // setSomedayEvents(_somedayEvents);
  }, [_somedayEvents]);
  */
