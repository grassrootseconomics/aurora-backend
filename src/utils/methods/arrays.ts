/**
 *
 * Groups arrays of props.
 *
 * @param arr Array of Objects.
 * @param prop Property to Group By.
 * @returns {{ [prop: string]: any[] }}
 */
export const groupArrayOfObjectsByProp = <OType>(
    arr: OType[],
    prop: string
): { [prop: string]: OType[] } => {
    return arr.reduce((rv, x) => {
        (rv[x[prop]] = rv[x[prop]] || []).push(x);
        return rv;
    }, {});
};
