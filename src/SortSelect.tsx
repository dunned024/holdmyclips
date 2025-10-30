import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import type { Clip } from "src/types";

export const SORT_KEY_MAP = {
  Newest: sortBy("uploadedOn", true),
  Oldest: sortBy("uploadedOn", false),
  "Title (A-Z)": sortBy("title", false),
  "Title (Z-A)": sortBy("title", true),
  "Duration (Short-Long)": sortBy("duration", false),
  "Duration (Long-Short)": sortBy("duration", true),
};

function sortBy(
  field: keyof Clip,
  reverse: boolean,
): (a: Clip, b: Clip) => number {
  return (a, b) => {
    const vA = a[field] ?? 0;
    const vB = b[field] ?? 0;
    const ord = reverse ? -1 : 1;
    return vA < vB ? -1 * ord : vA > vB ? 1 * ord : 0;
  };
}

interface SortSelectProps {
  sortKey: string;
  setSortKey: (sortKey: keyof typeof SORT_KEY_MAP) => void;
}

export function SortSelect(props: SortSelectProps) {
  const handleChange = (event: SelectChangeEvent) => {
    props.setSortKey(event.target.value as keyof typeof SORT_KEY_MAP);
  };

  return (
    <Box id="sort-select-box">
      <FormControl color="info" variant="filled" fullWidth>
        <InputLabel id="sort-key-select-label">Sort by</InputLabel>
        <Select
          labelId="sort-key-select-label"
          id="sort-key-select"
          value={props.sortKey}
          label="Sort by"
          onChange={handleChange}
        >
          {Object.entries(SORT_KEY_MAP).map(([sortKeyLabel]) => (
            <MenuItem key={sortKeyLabel} value={sortKeyLabel}>
              {sortKeyLabel}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
