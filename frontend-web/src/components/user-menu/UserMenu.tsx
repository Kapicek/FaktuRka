import { DarkMode, Settings, Logout, Person } from "@mui/icons-material"
import { Avatar, Button, Divider, FormControlLabel, FormGroup, ListItemIcon, Menu, MenuItem, Stack, Switch, Typography, useColorScheme } from "@mui/material";
import React from "react"
import { useDispatch } from "react-redux";
import { logout } from "../../features/auth/authSlice";

const UserMenu = () => {

    const dispatch = useDispatch();

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const { setMode, colorScheme } = useColorScheme();

    return (
        <React.Fragment>
            <Stack direction={"row"}>
                <Button variant="text" sx={{ textTransform: "none", borderRadius: 2 }} onClick={handleClick}>
                    <Stack direction={"column"} justifyContent={"center"} alignItems={"end"} mr={2}>
                        <Typography color="text.primary" fontWeight={600} lineHeight={1} variant="body2">Matěj Varga</Typography>
                        <Typography color="text.secondary" variant="caption">varga.matej@seznam.cz</Typography>
                    </Stack>
                    <Avatar sx={{ width: 48, height: 48 }}>M</Avatar>
                </Button>
            </Stack>
            <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                // onClick={handleClose}
                slotProps={{
                    paper: {
                        elevation: 0,
                        sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                            mt: 1.5,
                            '& .MuiAvatar-root': {
                                width: 32,
                                height: 32,
                                ml: -0.5,
                                mr: 1,
                            },
                            '&::before': {
                                content: '""',
                                display: 'block',
                                position: 'absolute',
                                top: 0,
                                right: 14,
                                width: 10,
                                height: 10,
                                bgcolor: 'background.paper',
                                transform: 'translateY(-50%) rotate(45deg)',
                                zIndex: 0,
                            },
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem>
                    <ListItemIcon>
                        <DarkMode fontSize="small" />
                    </ListItemIcon>
                    <FormGroup>
                        <FormControlLabel sx={{ ml: 0 }} control={<Switch checked={colorScheme === 'dark'}
                            onChange={() => setMode(colorScheme === 'dark' ? 'light' : 'dark')} />} label="Dark mode" labelPlacement="start" />
                    </FormGroup>
                </MenuItem>
                <MenuItem onClick={handleClose}>
                    <ListItemIcon>
                        <Person fontSize="small" />
                    </ListItemIcon>
                    Profile
                </MenuItem>
                <MenuItem onClick={handleClose}>
                    <ListItemIcon>
                        <Settings fontSize="small" />
                    </ListItemIcon>
                    Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => {
                    handleClose();
                    dispatch(logout());
                }}>
                    <ListItemIcon>
                        <Logout fontSize="small" />
                    </ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>
        </React.Fragment>
    )
}

export default UserMenu