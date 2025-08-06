import { format, parse } from "date-fns";

export const isMySQLDateTimeFormat = (value) => {
    try {
      const parsedDateTime = parse(value, 'yyyy-MM-dd HH:mm:ss', new Date());
      const formattedDateTime = format(parsedDateTime, 'yyyy-MM-dd HH:mm:ss');
      return formattedDateTime === value;
    } catch (error) {
      return false;
    }
  };
  