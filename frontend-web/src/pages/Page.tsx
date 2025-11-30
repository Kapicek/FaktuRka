import { Box, useColorScheme } from "@mui/material";
import type { ReactNode } from "react";

const Page = ({ children }: { children: ReactNode }) => {

    const { colorScheme } = useColorScheme();
    return (
        <Box
            sx={{
                p: 4,
                width: '100%',
                height: '100%',
                overflow: 'auto',
                bgcolor: colorScheme === 'dark' ? "background.default" : '#F7F7F7',
            }}
        >
            {children}
        </Box>
    )
}

export default Page