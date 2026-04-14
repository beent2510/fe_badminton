import React from 'react';
import { AppBar, Toolbar, Box, Typography, Button, IconButton, InputBase, Menu, MenuItem, Avatar, Badge } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";

const navItems = [
	{ label: 'Trang chủ' },
	{ label: 'Sân', active: true },
	{ label: 'Giải đấu' },
	{ label: 'CLB' },
	{ label: 'Giao lưu' },
	{ label: 'Quốc tế' },
	{ label: 'Tài liệu hướng dẫn' },
	{ label: 'Cập nhật & Góp ý' },
];

export default function Header() {
	return (
		<AppBar position="static" sx={{ bgcolor: '#fff', boxShadow: 1 }}>
			<Toolbar sx={{ minHeight: 64, px: 2 }}>
				<Box display="flex" alignItems="center" gap={2}>
					<img src="/logo192.png" alt="logo" style={{ height: 40 }} />
					<Typography variant="h5" fontWeight={700} color="#1ca05c" sx={{ letterSpacing: 1 }}>
						sport
						<Box component="span" color="#ff6600">net.vn</Box>
					</Typography>
				</Box>
				<Box flex={1} />
				<Box sx={{ bgcolor: '#f5f5f5', borderRadius: 2, px: 1, display: 'flex', alignItems: 'center', minWidth: 320 }}>
					<InputBase placeholder="Tìm thông tin" sx={{ ml: 1, flex: 1 }} />
					<IconButton size="small">
						<SearchIcon />
					</IconButton>
				</Box>
				<Box flex={1} />
				<IconButton color="inherit">
					<Badge color="success" variant="dot">
						<NotificationsNoneIcon />
					</Badge>
				</IconButton>
				<Button startIcon={<PersonOutlineIcon />} color="success" sx={{ ml: 1, fontWeight: 600 }}>
					Đăng nhập
				</Button>
			</Toolbar>
			<Box sx={{ bgcolor: '#178257', minHeight: 44, display: 'flex', alignItems: 'center', px: 2 }}>
				{navItems.map((item, idx) => (
					<Button
						key={item.label}
						sx={{
							color: item.active ? '#fff' : '#fff',
							bgcolor: item.active ? '#e86e1a' : 'transparent',
							fontWeight: 600,
							borderRadius: 0,
							mx: 0.5,
							px: 2,
							minHeight: 44,
							'&:hover': { bgcolor: item.active ? '#e86e1a' : '#15694a' },
						}}
					>
						{item.label}
					</Button>
				))}
			</Box>
		</AppBar>
	);
}
