import React from "react";
import {
  Box,
  Paper,
  Button,
  IconButton,
  Avatar,
  InputBase,
  Typography,
  Divider,
} from "@mui/material";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SettingsApplicationsOutlinedIcon from "@mui/icons-material/SettingsApplicationsOutlined";
import ChevronLeftOutlinedIcon from "@mui/icons-material/ChevronLeftOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import LiveHelpOutlinedIcon from "@mui/icons-material/LiveHelpOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import MenuOpenOutlinedIcon from "@mui/icons-material/MenuOpenOutlined";

const sidebarItems = [
  { label: "Asosiy", icon: <HomeOutlinedIcon fontSize="small" /> },
  { label: "O'qituvchilar", icon: <SchoolOutlinedIcon fontSize="small" /> },
  { label: "Guruhlar", icon: <GroupsOutlinedIcon fontSize="small" /> },
  { label: "Talabalar", icon: <PersonOutlineOutlinedIcon fontSize="small" /> },
  {
    label: "Boshqarish",
    icon: <SettingsApplicationsOutlinedIcon fontSize="small" />,
    active: true,
  },
];

const menuItems = [
  { label: "Kurslar", icon: <MenuBookOutlinedIcon fontSize="small" /> },
  { label: "Xonalar", icon: <MeetingRoomOutlinedIcon fontSize="small" /> },
  { label: "Hodimlar", icon: <BadgeOutlinedIcon fontSize="small" /> },
  { label: "FAQ", icon: <LiveHelpOutlinedIcon fontSize="small" /> },
  { label: "Tekshiruv", icon: <FactCheckOutlinedIcon fontSize="small" /> },
];

const topTabs = [
  "Kurslar",
  "Xonalar",
  "Hodimlar",
  "Tekshiruv",
];

export default function ManagementPage() {
  return (
    <Box className="min-h-screen bg-[#f6f7fb] flex">

      <Paper
        elevation={0}
        className="w-[250px] min-h-screen rounded-none border-r border-[#e9e9ef] flex flex-col justify-between bg-white"
      >
        <div>

          <div className="h-[78px] px-5 flex items-center gap-3 border-b border-[#f1f1f5]">
            <div className="w-8 h-8 rounded-full bg-[#f4c34f] flex items-center justify-center text-white font-bold text-sm">
              E
            </div>
            <Typography className="!text-[20px] !font-bold !text-[#6c4cf6]">
              CRM
            </Typography>
          </div>


          <div className="px-2 py-3">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-2 transition ${item.active
                    ? "bg-[#7c4dff] text-white shadow-sm"
                    : "text-[#4a4a57] hover:bg-[#f6f2ff]"
                  }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-[15px] font-medium">{item.label}</span>
                </div>

                {item.crown && (
                  <WorkspacePremiumOutlinedIcon
                    sx={{ fontSize: 18, color: "#f4b740" }}
                  />
                )}
              </button>
            ))}
          </div>


          <div className="px-5 pt-1">
            <IconButton
              sx={{
                border: "1px solid #ececf2",
                color: "#b4b4c2",
                width: 38,
                height: 38,
              }}
            >
              <ChevronLeftOutlinedIcon />
            </IconButton>
          </div>
        </div>


        <div className="p-4" />
      </Paper>


      <Box className="flex-1">

        <div className="h-[78px] px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Paper
              elevation={0}
              className="flex items-center px-4 h-[44px] w-[360px] rounded-2xl border border-[#ececf2] bg-white"
            >
              <SearchOutlinedIcon className="text-[#9ea0ad]" />
              <InputBase
                placeholder="Qidirish..."
                className="ml-2 flex-1 text-[14px]"
              />
            </Paper>
          </div>

          <div className="flex items-center gap-3">
            <Button
              endIcon={<KeyboardArrowDownOutlinedIcon />}
              variant="outlined"
              sx={{
                textTransform: "none",
                color: "#444",
                borderColor: "#ececf2",
                backgroundColor: "#fff",
                borderRadius: "14px",
                paddingX: "16px",
                height: "42px",
              }}
            >
              O'zbekcha
            </Button>

            <IconButton
              sx={{
                width: 42,
                height: 42,
                border: "1px solid #ececf2",
                backgroundColor: "#fff",
                borderRadius: "12px",
              }}
            >
              <NotificationsNoneOutlinedIcon />
            </IconButton>

            <IconButton
              sx={{
                width: 42,
                height: 42,
                backgroundColor: "#1f2430",
                color: "#fff",
                borderRadius: "12px",
                "&:hover": { backgroundColor: "#1f2430" },
              }}
            >
              <DarkModeOutlinedIcon />
            </IconButton>

            <Avatar
              src=""
              sx={{ width: 38, height: 38, bgcolor: "#2f1b15" }}
            />
          </div>
        </div>


        <div className="px-6 pb-6 flex">

          <Paper
            elevation={0}
            className="w-[250px] min-h-[720px] rounded-[24px] border border-[#ececf2] bg-white overflow-hidden"
          >
            <div className="px-4 py-4 flex items-center gap-3 border-b border-[#f3f3f7]">
              <IconButton
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "8px",
                  backgroundColor: "#7c4dff",
                  color: "#fff",
                  "&:hover": { backgroundColor: "#7c4dff" },
                }}
              >
                <MenuOpenOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>

              <Typography className="!text-[18px] !font-semibold">
                Menu
              </Typography>
            </div>

            <div className="p-4">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[#444654] hover:bg-[#f7f4ff] transition"
                >
                  <span className="text-[#6d7280]">{item.icon}</span>
                  <span className="text-[15px] font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </Paper>


          <div className="flex-1 pl-6">
            <div className="pt-28">
              <div className="flex flex-wrap gap-6 text-[15px] text-[#454857] font-medium">
                {topTabs.map((tab) => (
                  <span key={tab} className="cursor-pointer hover:text-[#7c4dff]">
                    {tab}
                  </span>
                ))}
              </div>

              <Divider className="!mt-4 !mb-0 !border-[#efeff5]" />

              <div className="min-h-[540px]"></div>
            </div>
          </div>
        </div>
      </Box>
    </Box>
  );
}