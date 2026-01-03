import * as v from 'valibot';

export const position = v.object({
  lat: v.number(),
  lng: v.number(),
  id: v.string(),
});

export const outgoingMessage = v.object({
  type: v.union([v.literal('add-marker'), v.literal('remove-marker')]),
  position: v.optional(position),
  id: v.optional(v.string()),
});

export const positions = v.array(
  v.object({
    location: v.tuple([v.number(), v.number()]),
    size: v.number(),
    id: v.string(),
  }),
);

export type OutgoingMessage = v.InferOutput<typeof outgoingMessage>;
export type Positions = v.InferOutput<typeof positions>;
export type Position = v.InferOutput<typeof position>;
