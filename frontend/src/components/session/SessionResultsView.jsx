// src/components/session/SessionResultsView.jsx
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { 
    Card, 
    Row, 
    Col, 
    Statistic, 
    Table, 
    Typography, 
    Divider, 
    Tag, 
    Space, 
    Avatar,
    Tabs
} from 'antd';
import {
    TrophyOutlined,
    CheckCircleOutlined,
    QuestionCircleOutlined,
    UserOutlined,
    TeamOutlined,
    StarOutlined
} from '@ant-design/icons';
  
const { Title, Text, Paragraph } = Typography;
const COLORS = ['#1890FF', '#36CBCB', '#4ECB73', '#FBD437', '#F2637B', '#975FE4', '#36CBCB'];
  