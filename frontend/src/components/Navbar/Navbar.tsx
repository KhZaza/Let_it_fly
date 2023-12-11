"use client";
import React from "react";

import {
  IconButton,
  Avatar,
  Box,
  CloseButton,
  Flex,
  HStack,
  VStack,
  Icon,
  useColorModeValue,
  Text,
  Drawer,
  DrawerContent,
  useDisclosure,
  BoxProps,
  FlexProps,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Button,
} from "@chakra-ui/react";
import {
  FiHome,
  FiCompass,
  FiSettings,
  FiMenu,
  FiBell,
  FiChevronDown,
  FiArchive, FiMap, FiCalendar, FiEdit2, FiClock
} from "react-icons/fi";
import { ImAirplane } from "react-icons/im";
import { IconType } from "react-icons";

import { useAuth } from "../../features/Authentication/authProvider";
import {Outlet, Link, useNavigate} from "react-router-dom";

interface LinkItemProps {
  name: string;
  icon: IconType;
  path: string;
}

interface NavItemProps extends FlexProps {
  icon: IconType;
  children: React.ReactNode;
  path: string;
}

interface User {
  firstName: string;
  lastName: string;
  isDriver: boolean;
}

interface MobileProps extends FlexProps {
  onOpen: () => void;
  user: User;
}

interface SidebarProps extends BoxProps {
  linkItems: Array<LinkItemProps>;
  onClose: () => void;
}

const LinkItems: Array<LinkItemProps> = [
  { name: "Home", icon: FiHome, path: '/'},
];

const RiderItems: Array<LinkItemProps> = [
  { name: "Home", icon: FiHome, path: '/'},
  { name: "Book Ride", icon: FiMap, path: '/reservation'},
  { name: "Upcoming Rides", icon: FiCalendar, path: '/upcoming'},
  { name: "Ride History", icon: FiArchive, path: '/history'},
  { name: "Settings", icon: FiSettings, path: '/settings' },
]

const DriverItems: Array<LinkItemProps> = [
  { name: "Home", icon: FiHome, path: '/'},
  { name: "Upcoming Rides", icon: FiCalendar, path: '/upcoming'},
  { name: "Ride History", icon: FiArchive, path: '/history'},
  { name: "Edit Schedule", icon: FiClock, path: '/schedule'},
  { name: "Reviews", icon: FiEdit2, path: '/reviews'},
  { name: "Settings", icon: FiSettings, path: '/settings' },
]

const SidebarContent = ({ onClose, linkItems, ...rest }: SidebarProps) => {
  return (
    <Box
      transition="3s ease"
      bg={useColorModeValue("white", "gray.900")}
      borderRight="1px"
      borderRightColor={useColorModeValue("gray.200", "gray.700")}
      w={{ base: "full", md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Link to ="/">
          <HStack spacing="1em">
          <ImAirplane size={20} />
          <Text fontSize="2xl" fontWeight="bold">
            Let It Fly
          </Text>
        </HStack>
        </Link>
        <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
      </Flex>
      {linkItems.map((link) => (
        <NavItem key={link.name} icon={link.icon} path={link.path}>
          {link.name}
        </NavItem>
      ))}
    </Box>
  );
};

const NavItem = ({ icon, children, path, ...rest }: NavItemProps) => {
  return (
      <Link to={path}>
        <Box
          as="a"
          style={{ textDecoration: "none" }}
          _focus={{ boxShadow: "none" }}
        >
          <Flex
            align="center"
            p="4"
            mx="4"
            borderRadius="lg"
            role="group"
            cursor="pointer"
            _hover={{
              bg: useColorModeValue("green.400", "gray.500"),
              color: "white",
            }}
            {...rest}
          >
            {icon && (
              <Icon
                mr="4"
                fontSize="16"
                _groupHover={{
                  color: "white",
                }}
                as={icon}
              />
            )}
            {children}
          </Flex>
        </Box>
      </Link>
  );
};

const MobileNav = ({ onOpen, user, ...rest }: MobileProps) => {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue("white", "gray.900")}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent={{ base: "space-between", md: "flex-end" }}
      {...rest}
    >
      <IconButton
        display={{ base: "flex", md: "none" }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />
      <HStack display={{ base: "flex", md: "none" }} spacing="1em">
        <ImAirplane size={20} />
        <Text fontSize="2xl" fontWeight="bold">
          Let It Fly
        </Text>
      </HStack>

      {user ? (
        <>
          <HStack spacing={{ base: "0", md: "6" }}>
            <Flex alignItems={"center"}>
              <Menu>
                <MenuButton
                  py={2}
                  transition="all 0.3s"
                  _focus={{ boxShadow: "none" }}
                >
                  <HStack>
                    <Avatar size={"sm"} name={`${user.firstName} ${user.lastName}`} />
                    <VStack
                      display={{ base: "none", md: "flex" }}
                      alignItems="flex-start"
                      spacing="1px"
                      ml="2"
                    >
                      <Text fontSize="sm">
                        {user.firstName} {user.lastName}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {user.isDriver ? 'Driver' : 'Rider'}
                      </Text>
                    </VStack>
                    <Box display={{ base: "none", md: "flex" }}>
                      <FiChevronDown />
                    </Box>
                  </HStack>
                </MenuButton>
                <MenuList>
                  <Link to="/settings"><MenuItem>Settings</MenuItem></Link>
                  <MenuDivider />
                  <MenuItem onClick={() => {
                    setToken(null);
                    navigate('/');
                  }}>Sign out</MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          </HStack>
        </>
      ) : (
        <HStack spacing={{ base: "2", md: "6" }}>
          <Link to="/sign-in"><Button colorScheme="gray">Sign In</Button></Link>
          <Link to="/sign-up"><Button colorScheme="gray">Sign Up</Button></Link>
        </HStack>
      )}
    </Flex>
  );
};

export default function LetItFlyNavbar({}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuth();
  const navItems = user ? (user.isDriver ? DriverItems : RiderItems) : LinkItems;
  console.log(user);

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.100", "gray.900")}>
      <SidebarContent
        onClose={() => onClose}
        display={{ base: "none", md: "block" }}
        linkItems={navItems}
      />
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} linkItems={navItems}/>
        </DrawerContent>
      </Drawer>
      <MobileNav onOpen={onOpen} user={user} />
      <Box ml={{ base: 0, md: 60 }}>
        <Outlet/>
      </Box>
    </Box>
  );
}
