package com.workgo.order.mapper;

import com.workgo.order.dto.response.OrderSnapshotResponse;
import com.workgo.order.entity.OrderSnapshot;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface OrderSnapshotMapper {

    OrderSnapshotResponse toOrderSnapshotResponse(OrderSnapshot orderSnapshot);

}
